package com.ssa.schoolerp.service;

import com.ssa.schoolerp.exception.ApiErrors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Nightly PostgreSQL backups with pg_dump (custom format, restore with pg_restore). Keeps the newest
 * {@code app.backup.keep} files in {@code app.backup.dir}. Does nothing when the database is not PostgreSQL.
 */
@Service
public class BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupService.class);
    private static final Pattern JDBC_URL = Pattern.compile("jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+).*");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    public record BackupFile(String name, long sizeBytes, LocalDateTime createdAt) {
    }

    private final String url;
    private final String username;
    private final String password;
    private final Path dir;
    private final int keep;
    private final String pgDumpSetting;
    private final Clock clock;

    public BackupService(@Value("${spring.datasource.url}") String url,
                         @Value("${spring.datasource.username:}") String username,
                         @Value("${spring.datasource.password:}") String password,
                         @Value("${app.backup.dir:backups}") String dir,
                         @Value("${app.backup.keep:14}") int keep,
                         @Value("${app.backup.pg-dump:}") String pgDump,
                         Clock clock) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.dir = Paths.get(dir).toAbsolutePath();
        this.keep = keep;
        this.pgDumpSetting = pgDump;
        this.clock = clock;
    }

    public boolean enabled() {
        return url.startsWith("jdbc:postgresql:");
    }

    @Scheduled(cron = "${app.backup.cron:0 30 2 * * *}", zone = "${app.timezone:Asia/Kolkata}")
    public void nightly() {
        if (!enabled()) return;
        try {
            BackupFile file = runBackup();
            log.info("Nightly backup written: {} ({} KB)", file.name(), file.sizeBytes() / 1024);
        } catch (RuntimeException e) {
            log.error("Nightly backup failed", e);
        }
    }

    public synchronized BackupFile runBackup() {
        if (!enabled()) {
            throw ApiErrors.badRequest("Backups only work with a PostgreSQL database");
        }
        Matcher m = JDBC_URL.matcher(url);
        if (!m.matches()) {
            throw ApiErrors.badRequest("Cannot read the database address from " + url);
        }
        try {
            Files.createDirectories(dir);
            String database = m.group(3);
            Path file = dir.resolve(database + "-" + LocalDateTime.now(clock).format(STAMP) + ".dump");
            ProcessBuilder pb = new ProcessBuilder(pgDump(), "-h", m.group(1), "-p", m.group(2) == null ? "5432" : m.group(2),
                    "-U", username, "-F", "c", "-f", file.toString(), database);
            pb.environment().put("PGPASSWORD", password);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (!process.waitFor(10, TimeUnit.MINUTES) || process.exitValue() != 0) {
                process.destroyForcibly();
                Files.deleteIfExists(file);
                throw new IllegalStateException("pg_dump failed: " + output.strip());
            }
            prune();
            return toBackupFile(file);
        } catch (IOException e) {
            throw new IllegalStateException("Could not run pg_dump (" + pgDump() + "): " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Backup interrupted", e);
        }
    }

    public List<BackupFile> list() {
        if (!Files.isDirectory(dir)) return List.of();
        try (Stream<Path> files = Files.list(dir)) {
            return files.filter(p -> p.toString().endsWith(".dump"))
                    .map(this::toBackupFile)
                    .sorted(Comparator.comparing(BackupFile::createdAt).reversed())
                    .toList();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    public Path directory() {
        return dir;
    }

    private void prune() throws IOException {
        List<BackupFile> files = list();
        for (int i = keep; i < files.size(); i++) {
            Files.deleteIfExists(dir.resolve(files.get(i).name()));
        }
    }

    private BackupFile toBackupFile(Path p) {
        try {
            return new BackupFile(p.getFileName().toString(), Files.size(p),
                    LocalDateTime.ofInstant(Files.getLastModifiedTime(p).toInstant(), ZoneId.of(clock.getZone().getId())));
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    /** The configured pg_dump, else the newest one in the standard Windows install folder, else pg_dump on PATH. */
    private String pgDump() {
        if (!pgDumpSetting.isBlank()) return pgDumpSetting;
        for (int version = 20; version >= 12; version--) {
            Path candidate = Paths.get("C:\\Program Files\\PostgreSQL\\" + version + "\\bin\\pg_dump.exe");
            if (Files.isRegularFile(candidate)) return candidate.toString();
        }
        return "pg_dump";
    }
}
