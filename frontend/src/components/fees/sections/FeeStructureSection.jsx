import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatCurrency, formatDate } from '@/utils';
import { FeeHeadModal } from '@/components/fees/FeeHeadModal';
import { DeleteFeeHeadDialog } from '@/components/fees/DeleteFeeHeadDialog';

/** Fee heads (GET /fees/heads) with add / edit / delete. An empty class selection shows every head. */
export const FeeStructureSection = ({ classes = [], meta, onToast }) => {
  const heads = useApi('/fees/heads');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, feeHead: null });
  const [toDelete, setToDelete] = useState(null);

  const toggleClass = (cls) =>
    setSelectedClasses((prev) => (prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]));

  const handleDelete = async (feeHead) => {
    await http.delete(`/fees/heads/${feeHead.id}`);
    setToDelete(null);
    heads.reload();
    onToast?.('Fee head deleted.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Class Selector Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedClasses([])}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
            selectedClasses.length === 0
              ? 'bg-[#FF6B2C] text-white border border-[#FF6B2C] shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300'
          }`}
        >
          All Classes
        </button>
        {classes.map((cls) => {
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

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {selectedClasses.length ? selectedClasses.join(', ') : 'All Classes'} — Fee Heads
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adding a fee head bills every student of the classes it is assigned to
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModal({ isOpen: true, feeHead: null })}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Fee Head</span>
          </button>
        </div>

        <AsyncState state={heads} loadingText="Loading fee heads…">
          {(list) => {
            const filtered = selectedClasses.length
              ? list.filter((fh) => (fh.classNames || []).some((c) => selectedClasses.includes(c)))
              : list;
            const total = filtered.reduce((sum, f) => sum + (f.amount || 0), 0);
            return (
              <>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">TITLE</th>
                        <th className="py-3.5 px-6">AMOUNT</th>
                        <th className="py-3.5 px-6">FREQUENCY</th>
                        <th className="py-3.5 px-6">DUE DATE</th>
                        <th className="py-3.5 px-6">CLASSES</th>
                        <th className="py-3.5 px-6">ACADEMIC YEAR</th>
                        <th className="py-3.5 px-6 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.length > 0 ? (
                        filtered.map((fh) => (
                          <tr key={fh.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                            <td className="py-4 px-6 font-bold text-slate-900">{fh.title}</td>
                            <td className="py-4 px-6 font-extrabold text-[#FF6B2C]">{formatCurrency(fh.amount)}</td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-slate-700 border border-orange-100">
                                {fh.frequency}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-600">{formatDate(fh.dueDate)}</td>
                            <td className="py-4 px-6 text-slate-600 max-w-[220px]" title={(fh.classNames || []).join(', ')}>
                              {(fh.classNames || []).join(', ') || '—'}
                            </td>
                            <td className="py-4 px-6 text-slate-600">{fh.academicYear}</td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setModal({ isOpen: true, feeHead: fh })}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Fee Head"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setToDelete(fh)}
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
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                            No fee heads configured for the selected classes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Total structures: {filtered.length}</span>
                  <span>
                    Sum of amounts:{' '}
                    <strong className="text-slate-900 font-extrabold ml-1">{formatCurrency(total)}</strong>
                  </span>
                </div>
              </>
            );
          }}
        </AsyncState>
      </div>

      <FeeHeadModal
        isOpen={modal.isOpen}
        feeHeadToEdit={modal.feeHead}
        classes={classes}
        frequencies={meta?.feeFrequencies}
        academicYear={meta?.academicYear}
        onClose={() => setModal({ isOpen: false, feeHead: null })}
        onSaved={() => {
          heads.reload();
          onToast?.(modal.feeHead ? 'Fee head updated.' : 'Fee head added and students billed.');
        }}
      />

      <DeleteFeeHeadDialog
        isOpen={Boolean(toDelete)}
        feeHead={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
