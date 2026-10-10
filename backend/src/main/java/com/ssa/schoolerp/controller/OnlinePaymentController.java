package com.ssa.schoolerp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.OnlinePayment;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.PublicEndpoint;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.payments.OnlinePaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Online fee payment through Razorpay. */
@RestController
@RequestMapping("/api/online-payments")
public class OnlinePaymentController {

    public record OrderRequest(@NotBlank String feeDueId, @Positive long amount) {
    }

    public record ConfirmRequest(@NotBlank String orderId, @NotBlank String paymentId, @NotBlank String signature) {
    }

    private final OnlinePaymentService payments;
    private final ObjectMapper json;

    public OnlinePaymentController(OnlinePaymentService payments, ObjectMapper json) {
        this.payments = payments;
        this.json = json;
    }

    /** Whether the "Pay online" button should be shown. */
    @GetMapping("/status")
    public ApiResponse<Map<String, Boolean>> status() {
        return ApiResponse.of(Map.of("enabled", payments.enabled()));
    }

    @RequireRole({Role.STUDENT, Role.PARENT})
    @PostMapping("/orders")
    public ApiResponse<Map<String, Object>> createOrder(@CurrentUser User user, @Valid @RequestBody OrderRequest request) {
        return ApiResponse.of(payments.createOrder(user, request.feeDueId(), request.amount()));
    }

    /** Called by the checkout after a successful payment. Razorpay's signature is the proof, so no login is needed. */
    @PublicEndpoint
    @PostMapping("/confirm")
    public ApiResponse<FeePayment> confirm(@Valid @RequestBody ConfirmRequest request) {
        return ApiResponse.success("Payment received", payments.confirm(request.orderId(), request.paymentId(),
                request.signature()));
    }

    /** Razorpay → server notification (set this URL in the Razorpay dashboard with the webhook secret). */
    @PublicEndpoint
    @PostMapping("/webhook")
    public ApiResponse<Void> webhook(@RequestBody String rawBody,
                                     @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        payments.webhook(rawBody, signature);
        return ApiResponse.success("ok");
    }

    /**
     * A small hosted checkout page. The mobile apps open it in the phone's browser; the order id (random, from
     * Razorpay) identifies the payment.
     */
    @PublicEndpoint
    @GetMapping(value = "/checkout/{orderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> checkoutPage(@PathVariable String orderId) throws Exception {
        Map<String, Object> d = payments.checkoutDetails(orderId);
        boolean paid = OnlinePayment.PAID.equals(d.get("status"));
        // JSON for a <script> block: "<" escaped so names cannot close the tag.
        String options = json.writeValueAsString(d).replace("<", "\\u003c");
        String html = """
                <!doctype html>
                <html lang="en"><head><meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Fee payment</title>
                <style>
                  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px}
                  .card{max-width:420px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px}
                  h1{font-size:20px;margin:0 0 4px} p{color:#475569;line-height:1.5}
                  .amount{font-size:32px;font-weight:800;margin:16px 0}
                  button{width:100%%;padding:14px;border:0;border-radius:12px;background:#ff6b2c;color:#fff;font-size:16px;font-weight:700}
                  .ok{color:#047857;font-weight:700} .err{color:#b91c1c}
                </style></head>
                <body><div class="card">
                  <h1 id="school"></h1><p id="desc"></p>
                  <div class="amount" id="amount"></div>
                  <button id="pay" %s>Pay now</button>
                  <p id="msg" class="%s">%s</p>
                </div>
                <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
                <script>
                  const d = %s;
                  document.getElementById('school').textContent = d.schoolName;
                  document.getElementById('desc').textContent = d.description;
                  document.getElementById('amount').textContent = '₹' + Number(d.amount).toLocaleString('en-IN');
                  const msg = document.getElementById('msg');
                  const button = document.getElementById('pay');
                  function open() {
                    const rzp = new Razorpay({
                      key: d.keyId, amount: d.amountPaise, currency: d.currency, order_id: d.orderId,
                      name: d.schoolName, description: d.description, prefill: d.prefill, theme: {color: '#ff6b2c'},
                      handler: async (r) => {
                        msg.className = ''; msg.textContent = 'Confirming payment…'; button.disabled = true;
                        const res = await fetch('../confirm', {method: 'POST', headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature})});
                        const body = await res.json().catch(() => ({}));
                        if (res.ok) { msg.className = 'ok'; msg.textContent = 'Payment received. Receipt ' + body.data.receiptNo + '. You can close this page and return to the app.'; button.style.display = 'none'; }
                        else { msg.className = 'err'; msg.textContent = body.message || 'The payment could not be confirmed. If money was taken it will be recorded automatically.'; }
                      }
                    });
                    rzp.on('payment.failed', (e) => { msg.className = 'err'; msg.textContent = 'Payment failed: ' + e.error.description; });
                    rzp.open();
                  }
                  button.addEventListener('click', open);
                </script></body></html>
                """.formatted(paid ? "style=\"display:none\"" : "", paid ? "ok" : "",
                paid ? "This fee payment is already complete." : "", options);
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }
}
