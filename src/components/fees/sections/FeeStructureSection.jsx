import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { formatCurrency } from '@/data/feeData';

export const FeeStructureSection = ({
  feeHeads,
  onAddFeeHead,
  onEditFeeHead,
  onDeleteFeeHead,
}) => {
  const [selectedClasses, setSelectedClasses] = useState(['1-A', '1-B']);

  const classList = [
    '1-A',
    '1-B',
    '10-A',
    '10-B',
    '2-A',
    '2-B',
    '3-A',
    '3-B',
    '4-A',
    '4-B',
    '5-A',
    '5-B',
    '6-A',
    '6-B',
    '7-A',
    '7-B',
    '8-A',
    '8-B',
    '9-A',
    '9-B',
  ];

  const toggleClass = (cls) => {
    setSelectedClasses((prev) => {
      if (prev.includes(cls)) {
        if (prev.length === 1) return prev; // keep at least 1 selected
        return prev.filter((c) => c !== cls);
      }
      return [...prev, cls];
    });
  };

  // Filter fee heads for selected classes
  const filteredFeeHeads = feeHeads.filter((fh) => {
    if (!fh.classIds || fh.classIds.length === 0) return true;
    return fh.classIds.some((c) => selectedClasses.includes(c));
  });

  const totalFeeSum = filteredFeeHeads.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Class Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {classList.map((cls) => {
          const isSelected = selectedClasses.includes(cls);
          return (
            <button
              key={cls}
              type="button"
              onClick={() => toggleClass(cls)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#FF6B2C] text-white border border-[#FF6B2C] shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300'
              }`}
            >
              {cls}
            </button>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header & Add Action */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {selectedClasses.join(', ')} — Fee Heads
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing active fee structure rules for selected classes
            </p>
          </div>

          <button
            type="button"
            onClick={onAddFeeHead}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Fee Head</span>
          </button>
        </div>

        {/* Fee Heads Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">TITLE</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6">FREQUENCY</th>
                <th className="py-3.5 px-6">DUE DATE</th>
                <th className="py-3.5 px-6">ACADEMIC YEAR</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeeHeads.length > 0 ? (
                filteredFeeHeads.map((fh) => (
                  <tr key={fh.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                    <td className="py-4 px-6 font-bold text-slate-900">{fh.title}</td>
                    <td className="py-4 px-6 font-extrabold text-[#FF6B2C]">
                      {formatCurrency(fh.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-slate-700 border border-orange-100">
                        {fh.frequency}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{fh.dueDate || '—'}</td>
                    <td className="py-4 px-6 text-slate-600">{fh.academicYear}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditFeeHead(fh)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Fee Head"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteFeeHead(fh)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Fee Head"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No fee heads configured for selected classes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span>Total structures: {filteredFeeHeads.length}</span>
          <span>
            Sum of amounts:{' '}
            <strong className="text-slate-900 font-extrabold ml-1">
              {formatCurrency(totalFeeSum)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
