package com.ssa.schoolerp.service.payments;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.OnlinePayment;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import com.ssa.schoolerp.service.FeeService;
import com.ssa.schoolerp.service.SettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Online fee payment: create a Razorpay order for a fee, then record the payment once Razorpay's signature
 * proves it was paid (from the checkout callback or the webhook — whichever arrives first; the other is ignored).
 */
@Service
public class OnlinePaymentService {

    private static final Logger log = LoggerFactory.getLogger(OnlinePaymentService.class);

    private final DataStore store;
    private final AccessGuard guard;
    private final FeeService fees;
    private final RazorpayGateway gateway;
    private final SettingsService settings;
    private final ObjectMapper json;
    private final Clock clock;

    public OnlinePaymentService(DataStore store, AccessGuard guard, FeeService fees, RazorpayGateway gateway,
                                SettingsService settings, ObjectMapper json, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.fees = fees;
        this.gateway = gateway;
        this.settings = settings;
        this.json = json;
        this.clock = clock;
    }

    public boolean enabled() {
        return gateway.enabled();
    }

    /** Everything the Razorpay checkout needs for this order. */
    public Map<String, Object> createOrder(User user, String feeDueId, long amount) {
        if (!gateway.enabled()) {
            throw ApiErrors.badRequest("Online payment is not set up yet. Please pay at the school office.");
        }
        FeeDue due = store.feeDues.getById(feeDueId);
        Student student = guard.checkStudentAccess(user, due.studentId());
        long payable = fees.payableNow(due);
        if (amount <= 0 || amount > payable) {
            throw ApiErrors.badRequest("You can pay between ₹1 and ₹" + payable + " for this fee");
        }
        String orderId;
        try {
            orderId = gateway.createOrder(amount * 100, due.id(), Map.of("studentId", student.id(), "feeDueId", due.id()));
        } catch (IllegalStateException e) {
            throw ApiErrors.badRequest(e.getMessage());
        }
        store.onlinePayments.save(new OnlinePayment(orderId, due.id(), student.id(), amount, OnlinePayment.CREATED,
                user.getId(), LocalDateTime.now(clock), null, null, null));
        return checkoutDetails(orderId);
    }

    /** Order details for the checkout form (also used by the hosted checkout page). */
    public Map<String, Object> checkoutDetails(String orderId) {
        OnlinePayment order = store.onlinePayments.getById(orderId);
        FeeDue due = store.feeDues.getById(order.feeDueId());
        Student student = store.students.getById(order.studentId());
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("orderId", order.id());
        details.put("keyId", gateway.keyId());
        details.put("amount", order.amount());
        details.put("amountPaise", order.amount() * 100);
        details.put("currency", "INR");
        details.put("schoolName", settings.get().schoolName());
        details.put("description", due.title() + " — " + student.name() + " (" + student.className() + ")");
        details.put("status", order.status());
        details.put("prefill", Map.of(
                "name", student.guardian() != null && student.guardian().name() != null ? student.guardian().name() : student.name(),
                "contact", student.guardian() != null && student.guardian().phone() != null ? student.guardian().phone() : ""));
        return details;
    }

    /** The checkout's success callback. Only a valid Razorpay signature records the payment. */
    public synchronized FeePayment confirm(String orderId, String gatewayPaymentId, String signature) {
        if (!gateway.validPaymentSignature(orderId, gatewayPaymentId, signature)) {
            throw ApiErrors.badRequest("The payment could not be verified");
        }
        return complete(orderId, gatewayPaymentId);
    }

    /** Razorpay webhook (payment.captured / order.paid). Ignores anything unsigned or unknown. */
    public synchronized void webhook(String rawBody, String signature) {
        if (!gateway.validWebhookSignature(rawBody, signature)) {
            throw ApiErrors.badRequest("Invalid webhook signature");
        }
        try {
            JsonNode payment = json.readTree(rawBody).path("payload").path("payment").path("entity");
            String orderId = payment.path("order_id").asText(null);
            String paymentId = payment.path("id").asText(null);
            String status = payment.path("status").asText("");
            if (orderId != null && paymentId != null && "captured".equals(status)
                    && store.onlinePayments.existsById(orderId)) {
                complete(orderId, paymentId);
            }
        } catch (java.io.IOException e) {
            throw ApiErrors.badRequest("Unreadable webhook body");
        }
    }

    private FeePayment complete(String orderId, String gatewayPaymentId) {
        OnlinePayment order = store.onlinePayments.getById(orderId);
        if (OnlinePayment.PAID.equals(order.status())) {
            return store.payments.getById(order.feePaymentId()); // already recorded by the other route
        }
        FeePayment payment = fees.recordOnlinePayment(order.feeDueId(), order.amount(), gatewayPaymentId);
        store.onlinePayments.save(order.paid(gatewayPaymentId, payment.id(), LocalDateTime.now(clock)));
        log.info("Online payment {} recorded for order {} (₹{})", gatewayPaymentId, orderId, order.amount());
        return payment;
    }
}
