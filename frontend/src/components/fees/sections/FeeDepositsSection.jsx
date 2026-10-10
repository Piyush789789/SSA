import React, { useState } from 'react';
import { BadgeCheck, Check, X } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Waiting for review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
];

const statusClass = (status) =>
  status === 'APPROVED'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : status === 'REJECTED'
    ? 'bg-rose-50 text-rose-700 border border-rose-200'
    : 'bg-amber-50 text-amber-700 border border-amber-200';

/**
 * Payments families report from the app (UPI / bank / cheque). They only count once an admin approves them
 * (POST /fees/deposits/{id}/approve), which records a real payment; rejecting leaves the due unchanged.
 */
export const FeeDepositsSection = ({ onToast }) => {
  const [status, setStatus] = useState('PENDING');
  const deposits = useApi(withQuery('/fees/deposits', { status }));
  const [review, setReview] = useState(null); // { deposit, action: 'approve' | 'reject' }

  const handleReview = async (note) => {
    const { deposit, action } = review;
    await http.post(`/fees/deposits/${deposit.id}/${action}`, note ? { note } : {});
    setReview(null);
    deposits.reload();
    onToast?.(action === 'approve' ? 'Deposit approved and payment recorded.' : 'Deposit rejected.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Deposits to Verify</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Payments reported by students and parents. Check the reference against your bank statement before approving.
              </p>
            </div>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <AsyncState state={deposits} loadingText="Loading deposits…">
          {(list) => (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">STUDENT</th>
                    <th className="py-3.5 px-6">FEE</th>
                    <th className="py-3.5 px-6">AMOUNT</th>
                    <th className="py-3.5 px-6">MODE / REFERENCE</th>
                    <th className="py-3.5 px-6">PAID ON</th>
                    <th className="py-3.5 px-6">SUBMITTED</th>
                    <th className="py-3.5 px-6">STATUS</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.length > 0 ? (
                    list.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium align-top">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{d.studentName}</div>
                          <div className="text-[11px] text-slate-400">
                            Class {d.className} • <span className="font-mono">{d.studentId}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-800">{d.feeTitle}</td>
                        <td className="py-4 px-6 font-extrabold text-slate-900">{formatCurrency(d.amount)}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-700">{d.paymentMode}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{d.referenceNo || '—'}</div>
                          {d.note && <div className="text-[11px] text-slate-400 italic mt-0.5">“{d.note}”</div>}
                        </td>
                        <td className="py-4 px-6 text-slate-600">{formatDate(d.paidOn)}</td>
                        <td className="py-4 px-6 text-slate-600">
                          <div>{d.submittedBy || '—'}</div>
                          <div className="text-[11px] text-slate-400">{formatDateTime(d.submittedAt)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusClass(d.status)}`}>
                            {d.status}
                          </span>
                          {d.status !== 'PENDING' && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              {d.reviewedBy ? `by ${d.reviewedBy}` : ''}
                              {d.reviewNote ? ` — ${d.reviewNote}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {d.status === 'PENDING' ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setReview({ deposit: d, action: 'approve' })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setReview({ deposit: d, action: 'reject' })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        {status === 'PENDING' ? 'No deposits are waiting for verification.' : 'No deposits found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </AsyncState>
      </div>

      <ConfirmDialog
        isOpen={Boolean(review)}
        tone={review?.action === 'approve' ? 'success' : 'danger'}
        title={review?.action === 'approve' ? 'Approve this deposit?' : 'Reject this deposit?'}
        message={
          review?.action === 'approve'
            ? 'A payment and receipt will be recorded against the fee.'
            : 'The fee stays unpaid. Add a note so the family knows why.'
        }
        detail={
          review
            ? `${review.deposit.studentName} — ${review.deposit.feeTitle}: ${formatCurrency(review.deposit.amount)} via ${
                review.deposit.paymentMode
              }${review.deposit.referenceNo ? ` (ref ${review.deposit.referenceNo})` : ''}`
            : null
        }
        confirmLabel={review?.action === 'approve' ? 'Approve' : 'Reject'}
        withNote
        notePlaceholder={review?.action === 'approve' ? 'Optional note' : 'Reason for rejecting (optional)'}
        onClose={() => setReview(null)}
        onConfirm={handleReview}
      />
    </div>
  );
};
