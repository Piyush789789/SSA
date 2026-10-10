package com.ssa.schoolerp.service.notify;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * SMS / WhatsApp to parents' phones. Provider "log" (default) only writes the message to the server log, so
 * nothing is sent or paid for until a provider is configured. Provider "twilio" sends real messages through
 * Twilio (channel "sms" or "whatsapp"); set the account in backend/.env:
 *
 * <pre>
 * NOTIFY_SMS_PROVIDER=twilio
 * NOTIFY_SMS_CHANNEL=whatsapp          (or sms)
 * TWILIO_ACCOUNT_SID=AC...
 * TWILIO_AUTH_TOKEN=...
 * TWILIO_FROM=+1415...                 (for WhatsApp: the approved WhatsApp sender number)
 * </pre>
 */
@Component
public class TextMessenger {

    private static final Logger log = LoggerFactory.getLogger(TextMessenger.class);

    private final String provider;
    private final String channel;
    private final String accountSid;
    private final String authToken;
    private final String from;
    private final String defaultCountryCode;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public TextMessenger(@Value("${app.notify.sms.provider:log}") String provider,
                         @Value("${app.notify.sms.channel:sms}") String channel,
                         @Value("${app.notify.sms.twilio.account-sid:}") String accountSid,
                         @Value("${app.notify.sms.twilio.auth-token:}") String authToken,
                         @Value("${app.notify.sms.twilio.from:}") String from,
                         @Value("${app.notify.sms.default-country-code:+91}") String defaultCountryCode) {
        this.provider = provider.trim().toLowerCase();
        this.channel = channel.trim().toLowerCase();
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.from = from;
        this.defaultCountryCode = defaultCountryCode;
    }

    /** True when real messages go out (a provider other than "log" is configured). */
    public boolean live() {
        return "twilio".equals(provider) && !accountSid.isBlank() && !authToken.isBlank() && !from.isBlank();
    }

    public String describe() {
        return live() ? "Twilio " + channel : "not configured (messages are only logged)";
    }

    public void send(String phone, String text) {
        String to = normalise(phone);
        if (to == null) return;
        if (!live()) {
            log.info("[{} not sent — no provider configured] to {}: {}", channel.toUpperCase(), to, text);
            return;
        }
        String prefix = "whatsapp".equals(channel) ? "whatsapp:" : "";
        Map<String, String> form = Map.of("To", prefix + to, "From", prefix + from, "Body", text);
        String body = form.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
        HttpRequest request = HttpRequest.newBuilder(
                        URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(
                        (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8)))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        http.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(r -> {
                    if (r.statusCode() >= 300) log.warn("Twilio send to {} failed ({}): {}", to, r.statusCode(), r.body());
                })
                .exceptionally(e -> {
                    log.warn("Twilio send to {} failed: {}", to, e.toString());
                    return null;
                });
    }

    /** "+91 98765 12345", "098765 12345" or "9876512345" -> "+919876512345". Null if not a usable number. */
    String normalise(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9+]", "");
        if (digits.startsWith("+")) return digits.length() >= 11 ? digits : null;
        digits = digits.replaceFirst("^0+", "");
        return digits.length() == 10 ? defaultCountryCode + digits : null;
    }
}
