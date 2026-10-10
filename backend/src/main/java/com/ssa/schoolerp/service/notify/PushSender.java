package com.ssa.schoolerp.service.notify;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Sends phone notifications through Expo's push service (works for the Expo Go and installed apps).
 * Fire-and-forget: failures are logged and never affect the request that caused them.
 */
@Component
public class PushSender {

    private static final Logger log = LoggerFactory.getLogger(PushSender.class);
    private static final URI EXPO_PUSH = URI.create("https://exp.host/--/api/v2/push/send");
    private static final int BATCH = 100; // Expo accepts up to 100 messages per request

    private final boolean enabled;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper json;

    public PushSender(@Value("${app.notify.push.enabled:true}") boolean enabled, ObjectMapper json) {
        this.enabled = enabled;
        this.json = json;
    }

    public void send(List<String> tokens, String title, String body, String link) {
        if (!enabled || tokens.isEmpty()) return;
        List<Map<String, Object>> messages = new ArrayList<>();
        for (String token : tokens) {
            messages.add(Map.of("to", token, "title", title, "body", body, "sound", "default",
                    "data", Map.of("link", link == null ? "" : link)));
        }
        for (int i = 0; i < messages.size(); i += BATCH) {
            List<Map<String, Object>> batch = messages.subList(i, Math.min(i + BATCH, messages.size()));
            try {
                HttpRequest request = HttpRequest.newBuilder(EXPO_PUSH)
                        .timeout(Duration.ofSeconds(15))
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(batch)))
                        .build();
                http.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                        .thenAccept(r -> {
                            if (r.statusCode() >= 300) log.warn("Expo push failed ({}): {}", r.statusCode(), r.body());
                        })
                        .exceptionally(e -> {
                            log.warn("Expo push failed: {}", e.toString());
                            return null;
                        });
            } catch (Exception e) {
                log.warn("Could not send push notifications", e);
            }
        }
    }
}
