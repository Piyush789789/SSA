import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { formatDate, parseIsoDate } from '@/utils';
import { useI18n } from '@/i18n/translate';

const daysUntil = (today, date) =>
  Math.round((parseIsoDate(date) - parseIsoDate(today)) / (24 * 60 * 60 * 1000));

const daysLabel = (days) => {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
};

/** Upcoming exam papers from GET /dashboard (UpcomingPaper list). */
export const UpcomingExams = ({ papers = [], today, limit = 5 }) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {t('dash.upcomingExams')}
          </h3>
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_EXAMS)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {t('common.viewAll')}
          </button>
        </div>

        {papers.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium py-6 text-center">No upcoming exam papers.</p>
        ) : (
          <div className="space-y-3">
            {papers.slice(0, limit).map((paper) => (
              <div
                key={paper.scheduleId}
                onClick={() => navigate(`/admin/exams/${paper.examId}`)}
                className="bg-[#FFF8F5] border border-orange-100/70 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-transform hover:scale-[1.01] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-orange-100/90 text-[#FF6B2C] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                      {paper.subject} · Class {paper.className}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{paper.examName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                      <span>
                        {formatDate(paper.date)}
                        {paper.startTime ? `, ${paper.startTime}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#FFEBE0] text-[#EA580C] border border-[#FF6B2C]/10 shadow-2xs">
                    {daysLabel(daysUntil(today, paper.date))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
