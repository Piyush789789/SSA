import React from 'react';
import { X, Printer, GraduationCap } from 'lucide-react';
import { formatCurrency } from '@/data/feeData';

export const PaymentReceiptModal = ({ isOpen, transaction, onClose }) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 flex flex-col max-h-[90vh]">
        {/* Close Button (Hidden on Print) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Area */}
        <div id="printable-receipt" className="space-y-6 flex-1 overflow-y-auto pr-1">
          {/* Receipt Branding Header */}
          <div className="text-center border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-[#FF6B2C]/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              SSA SHIV SHANTI ADARSH ACADEMY
            </h2>
            <p className="text-xs font-semibold text-[#FF6B2C] mt-0.5">
              Fee Payment Receipt
            </p>
          </div>

          {/* Key Receipt Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Receipt No</span>
              <strong className="text-slate-900 font-bold font-mono text-[11px]">
                {transaction.receiptNo}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Date & Time</span>
              <strong className="text-slate-900 font-semibold">
                {transaction.date} {transaction.time ? `• ${transaction.time}` : ''}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Student</span>
              <strong className="text-slate-900 font-bold">{transaction.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Student ID</span>
              <strong className="text-slate-900 font-semibold">
                {transaction.studentIdStr || `STU-2026-000${transaction.studentId}`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Class</span>
              <strong className="text-slate-900 font-semibold">{transaction.className}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Roll No</span>
              <strong className="text-slate-900 font-semibold">{transaction.rollNo || 1}</strong>
            </div>
          </div>

          {/* Amount Paid Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-orange-50/50 text-slate-600 font-bold border-b border-slate-100">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-800">{transaction.feeHead}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-3 px-4 text-slate-900">Amount Paid</td>
                  <td className="py-3 px-4 text-right text-[#FF6B2C] text-sm">
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Mode & Notes */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-600 pt-1">
            <div>
              <span className="text-slate-400">Mode:</span>{' '}
              <strong className="text-slate-800 font-semibold">{transaction.paymentMode}</strong>
            </div>
            {transaction.remarks && (
              <div>
                <span className="text-slate-400">Ref:</span>{' '}
                <span className="text-slate-700 italic">{transaction.remarks}</span>
              </div>
            )}
          </div>

          {/* Computer Generated Footer */}
          <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            Computer-generated receipt · No signature required
          </div>
        </div>

        {/* Modal Action Buttons (Hidden on Print) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 print:hidden shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
