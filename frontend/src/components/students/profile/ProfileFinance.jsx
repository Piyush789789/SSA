import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Wallet, Receipt, CreditCard } from 'lucide-react';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';

const STATUS_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700',
  Partial: 'bg-amber-50 text-amber-700',
  Pending: 'bg-slate-100 text-slate-700',
  Overdue: 'bg-rose-50 text-rose-700',
};

/** Fee summary (GET /fees/students/{id}/summary) and payment history (GET /fees/payments?studentId=). */
export const ProfileFinance = ({ student }) => {
  const navigate = useNavigate();
  const summary = useApi(`/fees/students/${encodeURIComponent(student.id)}/summary`);
  const payments = useApi(withQuery('/fees/payments', { studentId: student.id }));

  return (
    <div className="space-y-6">
      <AsyncState state={summary} loadingText="Loading fees…">
        {(s) => (
          <>
            {/* Fee Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Total Fees</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(s.total)}</p>
                {s.concession > 0 && (
                  <p className="text-xs text-slate-500 mt-1">Concession: {formatCurrency(s.concession)}</p>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Total Paid</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(s.paid)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full translate-x-16 -translate-y-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Pending Dues</p>
                  </div>
                  <p className="text-2xl font-bold text-rose-600">{formatCurrency(s.pending)}</p>
                  {s.overdue > 0 && <p className="text-xs text-rose-500 mt-1">Overdue: {formatCurrency(s.overdue)}</p>}
                </div>
              </div>
            </div>

            {/* Fee Dues */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">Fee Dues</h3>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.FEES)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors self-start sm:self-auto"
                >
                  <CreditCard className="w-4 h-4" /> Collect Fee
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Description</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Concession</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(s.dues || []).map((due) => (
                      <tr key={due.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-slate-900">{due.title}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{formatCurrency(due.amount)}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{formatCurrency(due.concession)}</td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-900">{formatCurrency(due.paid)}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{formatCurrency(due.pending)}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{formatDate(due.dueDate)}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[due.status] || STATUS_STYLES.Pending}`}>
                            {due.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!s.dues || s.dues.length === 0) && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-sm text-slate-500">
                          No fees have been billed to this student.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </AsyncState>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
        </div>
        <AsyncState state={payments} loadingText="Loading payments…">
          {(list) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipt</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">{p.receiptNo}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{p.feeTitle}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{formatDateTime(p.paidAt)}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{p.paymentMode}</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-sm text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </AsyncState>
      </div>
    </div>
  );
};
