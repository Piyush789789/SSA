package com.ssa.schoolerp.service.payments;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

/**
 * Talks to Razorpay: creates orders and checks the signatures Razorpay puts on successful payments and webhooks.
 * Configure in backend/.env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and (for the webhook) RAZORPAY_WEBHOOK_SECRET.
 */
@Component
public class RazorpayGateway {

    private static final URI ORDERS = URI.create("https://api.razorpay.com/v1/orders");

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public RazorpayGateway(@Value("${app.payments.razorpay.key-id:}") String keyId,
                           @Value("${app.payments.razorpay.key-secret:}") String keySecret,
                           @Value("${app.payments.razorpay.webhook-secret:}") String webhookSecret,
                           ObjectMapper json) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.json = json;
    }

    public boolean enabled() {
        return !keyId.isBlank() && !keySecret.isBlank();
    }

    public String keyId() {
        return keyId;
    }

    /** Creates an order for {@code amountPaise} (₹1 = 100 paise) and returns its id. */
    public String createOrder(long amountPaise, String receipt, Map<String, String> notes) {
        try {
            String body = json.writeValueAsString(Map.of("amount", amountPaise, "currency", "INR",
                    "receipt", receipt, "notes", notes));
            HttpRequest request = HttpRequest.newBuilder(ORDERS)
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(
                            (keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8)))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode node = json.readTree(response.body());
            if (response.statusCode() >= 300 || !node.hasNonNull("id")) {
                String reason = node.path("error").path("description").asText(response.body());
                throw new IllegalStateException("Razorpay did not create the order: " + reason);
            }
            return node.get("id").asText();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while contacting Razorpay", e);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Could not reach Razorpay: " + e.getMessage(), e);
        }
    }

    /** The checkout's success callback: signature = HMAC-SHA256(orderId + "|" + paymentId, key secret). */
    public boolean validPaymentSignature(String orderId, String paymentId, String signature) {
        return !keySecret.isBlank() && matches(hmac(keySecret, orderId + "|" + paymentId), signature);
    }

    /** Webhooks: X-Razorpay-Signature = HMAC-SHA256(raw body, webhook secret). */
    public boolean validWebhookSignature(String rawBody, String signature) {
        return !webhookSecret.isBlank() && matches(hmac(webhookSecret, rawBody), signature);
    }

    private static String hmac(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean matches(String expected, String actual) {
        return actual != null && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                actual.trim().getBytes(StandardCharsets.UTF_8));
    }
}
