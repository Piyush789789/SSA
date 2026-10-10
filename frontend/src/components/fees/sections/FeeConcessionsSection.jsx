import React, { useMemo, useState } from 'react';
import { Plus, Undo2 } from 'lucide-react';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatCurrency, formatDate } from '@/utils';
import { ConcessionModal } from '@/components/fees/ConcessionModal';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { useI18n } from '@/i18n/translate';

/** Concessions granted so far (GET /fees/concessions); new ones lower what is owed on a due. */
export const FeeConcessionsSection = ({ classes = [], meta, onToast }) => {
  const { tx } = useI18n();
  const concessions = useApi('/fees/concessions');
  const studentsApi = useApi('/students');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null); // concession being withdrawn

  const studentsById = useMemo(
    () => new Map((studentsApi.data || []).map((s) => [s.id, s])),
    [studentsApi.data],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Concession / Discount Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Apply % or flat discounts to a student's unpaid fee — it reduces the amount owed
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Concession</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={concessions} loadingText="Loading concessions…">
          {(list) => (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">STUDENT</th>
                    <th className="py-3.5 px-6">CLASS</th>
                    <th className="py-3.5 px-6">FEE</th>
                    <th className="py-3.5 px-6">TYPE</th>
                    <th className="py-3.5 px-6">DISCOUNT</th>
                    <th className="py-3.5 px-6">AMOUNT OFF</th>
                    <th className="py-3.5 px-6">DESCRIPTION</th>
                    <th className="py-3.5 px-6">APPROVED</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.length > 0 ? (
                    list.map((c) => {
                      const student = studentsById.get(c.studentId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900">{student?.name || c.studentId}</div>
                            {student && <div className="text-[11px] text-slate-400 font-mono">{c.studentId}</div>}
                          </td>
                          <td className="py-4 px-6 text-slate-700">{student?.className || '—'}</td>
                          <td className="py-4 px-6 font-medium text-slate-800">{c.feeTitle}</td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-slate-700 border border-orange-100">
                              {c.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-extrabold text-emerald-600">
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-slate-900">{formatCurrency(c.discountAmount)}</td>
                          <td className="py-4 px-6 text-slate-600 max-w-xs truncate" title={c.description}>
                            {c.description || '—'}
                          </td>
                          <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                            <div>{c.approvedBy || '—'}</div>
                            <div className="text-[11px] text-slate-400">{formatDate(c.approvedOn)}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setWithdrawing(c)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              {tx('Withdraw')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No concessions applied yet. Click "Add Concession" above to configure a discount.
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
        isOpen={Boolean(withdrawing)}
        title="Withdraw concession"
        message={
          withdrawing
            ? `Withdraw the ${formatCurrency(withdrawing.discountAmount)} concession on "${withdrawing.feeTitle}"?`
            : ''
        }
        detail="The student will owe this amount again."
        confirmLabel="Withdraw"
        onClose={() => setWithdrawing(null)}
        onConfirm={async () => {
          await http.delete(`/fees/concessions/${withdrawing.id}`);
          onToast?.(`Concession of ${formatCurrency(withdrawing.discountAmount)} withdrawn.`);
          setWithdrawing(null);
          concessions.reload();
        }}
      />

      <ConcessionModal
        isOpen={isModalOpen}
        classes={classes}
        concessionTypes={meta?.concessionTypes}
        onClose={() => setIsModalOpen(false)}
        onSaved={(saved) => {
          concessions.reload();
          onToast?.(`Concession of ${formatCurrency(saved?.discountAmount)} applied.`);
        }}
      />
    </div>
  );
};
