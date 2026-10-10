import React from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { formatCurrency } from '@/data/feeData';

export const FeeConcessionsSection = ({
  concessions,
  onAddConcession,
  onDeleteConcession,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Add Action */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Concession / Discount Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Apply % or flat discounts per student per fee head
          </p>
        </div>

        <button
          type="button"
          onClick={onAddConcession}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Concession</span>
        </button>
      </div>

      {/* Concession Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">STUDENT</th>
                <th className="py-3.5 px-6">CLASS</th>
                <th className="py-3.5 px-6">FEE STRUCTURE</th>
                <th className="py-3.5 px-6">TYPE</th>
                <th className="py-3.5 px-6">DISCOUNT</th>
                <th className="py-3.5 px-6">EFFECTIVE AMOUNT</th>
                <th className="py-3.5 px-6">DESCRIPTION</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {concessions.length > 0 ? (
                concessions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                    <td className="py-4 px-6 font-bold text-slate-900">{c.studentName}</td>
                    <td className="py-4 px-6 text-slate-700">{c.className}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">{c.feeStructure}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-slate-700 border border-orange-100">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-emerald-600">
                      {c.discountType === 'Percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      {formatCurrency(c.effectiveAmount)}
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate" title={c.description}>
                      {c.description}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteConcession(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Concession"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No concessions applied yet. Click "Add Concession" above to configure a discount.
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
