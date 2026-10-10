import React, { useState } from 'react';
import { AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';

const CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let checkoutPromise = null;

/** Loads Razorpay's checkout.js once, on demand. */
const loadCheckout = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!checkoutPromise) {
    checkoutPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_URL;
      script.async = true;
      script.onload = () =>
        window.Razorpay ? resolve(window.Razorpay) : reject(new Error('The payment window could not be loaded.'));
      script.onerror = () => {
        checkoutPromise = null;
        script.remove();
        reject(new Error('Could not load the payment window. Check your internet connection and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return checkoutPromise;
};

/**
 * "Pay online" for one fee due via Razorpay: creates an order for `amount`, opens the checkout, and on success
 * confirms the payment with the server. `onPaid(payment)` receives the issued receipt (FeePayment); the page shows it
 * and reloads its fee data.
 */
export const OnlinePayButton = ({ due, amount, onPaid, className = '' }) => {
  const { tx } = useI18n();
  const [stage, setStage] = useState('idle'); // idle | opening | open | confirming
  const [error, setError] = useState('');

  const pay = async () => {
    setError('');
    setStage('opening');
    try {
      const order = await http.post('/online-payments/orders', { feeDueId: due.id, amount });
      const Razorpay = await loadCheckout();
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        order_id: order.orderId,
        name: order.schoolName,
        description: order.description,
        prefill: order.prefill,
        theme: { color: '#FF6B2C' },
        handler: async (response) => {
          setStage('confirming');
          try {
            const payment = await http.post('/online-payments/confirm', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (onPaid) onPaid(payment);
          } catch (err) {
            setError(
              `${err.message} If money was deducted, keep the payment ID ${response.razorpay_payment_id} and contact the school office.`,
            );
          } finally {
            setStage('idle');
          }
        },
        modal: {
          ondismiss: () => setStage((s) => (s === 'confirming' ? s : 'idle')),
        },
      });
      checkout.on('payment.failed', (response) => {
        setError(response?.error?.description || 'The payment failed. No money was taken; please try again.');
      });
      setStage('open');
      checkout.open();
    } catch (err) {
      setError(err.message);
      setStage('idle');
    }
  };

  const busy = stage !== 'idle';

  return (
    <>
      <button
        type="button"
        onClick={pay}
        disabled={busy || !(amount > 0)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
        {stage === 'confirming' ? 'Confirming…' : busy ? 'Opening…' : 'Pay online'}
      </button>

      {error && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 text-left whitespace-normal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Payment not completed</h3>
            </div>
            <p className="text-sm text-slate-600">{error}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setError('')}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {tx('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnlinePayButton;
