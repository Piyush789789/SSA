import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate, initialsOf } from '@/utils';

const STATUS_ORDER = { Overdue: 0, Partial: 1, Pending: 2 };

/** Unpaid fee dues (GET /fees/dues), overdue first. */
export const PendingFees = ({ dues = [], studentsWithDues, depositsToVerify = 0, limit = 5 }) => {
  const navigate = useNavigate();

  const unpaid = useMemo(
    () =>
      dues
        .filter((d) => Number(d.pending) > 0)
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
            String(a.dueDate).localeCompare(String(b.dueDate)),
        ),
    [dues],
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Pending Fees
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100">
            {studentsWithDues ?? new Set(unpaid.map((d) => d.studentId)).size} students
          </span>
        </div>

        {depositsToVerify > 0 && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.FEES)}
            className="w-full mb-4 text-left px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
          >
            {depositsToVerify} reported {depositsToVerify === 1 ? 'payment' : 'payments'} waiting for verification
          </button>
        )}

        {unpaid.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium py-6 text-center">No pending fees.</p>
        ) : (
          <div className="space-y-3.5">
            {unpaid.slice(0, limit).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/admin/students/${item.studentId}`)}
                className="flex items-start justify-between gap-3 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-100/70 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {initialsOf(item.studentName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                      {item.studentName}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                      Class {item.className} · {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">Due {formatDate(item.dueDate)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold ${
                      item.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100/80 text-[#EA580C]'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#E04E15]">
                    {formatCurrency(item.pending)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {unpaid.length > limit && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.FEES)}
          className="mt-4 text-xs font-bold text-[#FF6B2C] hover:underline self-start cursor-pointer"
        >
          View all {unpaid.length} unpaid dues
        </button>
      )}
    </div>
  );
};
