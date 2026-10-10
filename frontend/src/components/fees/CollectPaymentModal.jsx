import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/data/feeData';

export const CollectPaymentModal = ({ isOpen, feeDue, student, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const balance = feeDue ? feeDue.total - feeDue.paid : 0;

  useEffect(() => {
    if (isOpen && feeDue) {
      setAmount(String(balance));
      setPaymentMode('Cash');
      setRemarks('');
      setError('');
    }
  }, [isOpen, feeDue, balance]);

  if (!isOpen || !feeDue || !student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payVal = Number(amount);
    if (isNaN(payVal) || payVal <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (payVal > balance) {
      setError(`Amount cannot exceed the remaining balance of ${formatCurrency(balance)}.`);
      return;
    }

    onConfirm({
      feeDueId: feeDue.id,
      studentId: student.id,
      amount: payVal,
      paymentMode,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Collect — {feeDue.title}
              </h3>
              <p className="text-xs text-slate-500">
                Student: {student.name} ({student.studentId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Due Summary Banner */}
        <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Total Due:</span>{' '}
            <strong className="text-slate-800 font-bold">{formatCurrency(feeDue.total)}</strong>
          </div>
          <div>
            <span className="text-slate-500">Already Paid:</span>{' '}
            <strong className="text-emerald-600 font-bold">{formatCurrency(feeDue.paid)}</strong>
          </div>
          <div>
            <span className="text-slate-500">Remaining:</span>{' '}
            <strong className="text-rose-600 font-bold">{formatCurrency(balance)}</strong>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Paying */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Amount Paying (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={balance}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="Enter amount"
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
              }`}
            />
            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="DD">DD</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Cheque no., transaction reference, or notes..."
              className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm & Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
