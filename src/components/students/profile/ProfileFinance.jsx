import React from 'react';
import { IndianRupee, Wallet, Receipt, CreditCard } from 'lucide-react';

export const ProfileFinance = ({ student }) => {
  const { feeSummary, feeHistoryData } = student;

  return (
    <div className="space-y-6">
      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Total Fees</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{feeSummary?.total || '₹0'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{feeSummary?.totalPaid || '₹0'}</p>
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
            <p className="text-2xl font-bold text-rose-600">{feeSummary?.pending || '₹0'}</p>
          </div>
        </div>
      </div>

      {/* Fee History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">Fee History</h3>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors self-start sm:self-auto">
            <CreditCard className="w-4 h-4" /> Collect Fee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Description</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeHistoryData?.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="text-sm font-medium text-slate-900">{fee.title}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-slate-600">{fee.amount}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-medium text-slate-900">{fee.paid}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-slate-600">{fee.datePaid}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-slate-600">{fee.mode}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {fee.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!feeHistoryData || feeHistoryData.length === 0) && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm text-slate-500">
                    No fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
