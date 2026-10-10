import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils';

/** Success panel after an online payment: receipt number, fee, amount and time. */
export const OnlinePaymentReceipt = ({ payment, onClose }) => {
  if (!payment) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-bold">
            Payment successful — receipt no. <span className="font-mono">{payment.receiptNo}</span>
          </p>
          <p className="text-emerald-700 mt-0.5">
            {formatCurrency(payment.amount)} for {payment.feeTitle || 'fees'}
            {payment.paidAt ? ` on ${formatDateTime(payment.paidAt)}` : ''}. It is listed in your payment history below.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="self-end sm:self-auto p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default OnlinePaymentReceipt;
