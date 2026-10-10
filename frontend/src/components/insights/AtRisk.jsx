import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react';
import { withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatCurrency } from '@/utils';
import { useI18n } from '@/i18n/translate';
import { ExportButton } from '@/components/common/ExportButton';

/** Colour of the urgency score badge (higher = more urgent). */
const scoreTone = (score) =>
  score >= 60
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : score >= 30
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-sky-50 text-sky-700 border-sky-200';

export const ReasonChips = ({ reasons }) => (
  <div className="flex flex-wrap gap-1.5">
    {(reasons ?? []).map((reason) => (
      <span
        key={reason}
        className="px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700"
      >
        {reason}
      </span>
    ))}
  </div>
);

const Metric = ({ label, value, warn }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className={`text-xs font-bold ${warn ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

/** Full list of students needing attention, most urgent first, each linking to the student's profile. */
export const AtRiskList = ({ students, profileBase }) => {
  const { t } = useI18n();
  if (!students?.length) return <EmptyMessage text={t('atRisk.none')} />;
  return (
    <ul className="divide-y divide-slate-100">
      {students.map((s) => (
        <li key={s.studentId} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className={`shrink-0 w-12 text-center px-2 py-1 rounded-xl border text-sm font-black ${scoreTone(s.score)}`}
              title={t('atRisk.score')}
            >
              {s.score}
            </span>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-extrabold text-slate-900">
                {s.name}
                <span className="ml-2 text-[11px] font-semibold text-slate-400">
                  {t('common.class')} {s.className}
                  {s.rollNumber != null ? ` · Roll ${s.rollNumber}` : ''}
                </span>
              </p>
              <ReasonChips reasons={s.reasons} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:w-[420px] shrink-0">
            <Metric
              label={t('atRisk.attendance')}
              value={s.attendanceRate == null ? '—' : `${Math.round(s.attendanceRate * 10) / 10}%`}
              warn={s.attendanceRate != null && s.attendanceRate < 75}
            />
            <Metric
              label={t('atRisk.marks')}
              value={s.averageMarks == null ? '—' : `${Math.round(s.averageMarks * 10) / 10}%`}
              warn={s.averageMarks != null && s.averageMarks < 40}
            />
            <Metric label={t('atRisk.overdueFees')} value={formatCurrency(s.overdueFees)} warn={s.overdueFees > 0} />
            <Metric label={t('atRisk.missingHomework')} value={s.missingHomework} warn={s.missingHomework > 0} />
          </div>
          <Link
            to={`${profileBase}/${encodeURIComponent(s.studentId)}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:underline shrink-0"
          >
            {t('atRisk.profile')} <ChevronRight className="w-4 h-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
};

/** Dashboard card "Students needing attention (n)" with the three most urgent and a link to the full list. */
export const AtRiskSummaryCard = ({ linkTo, profileBase }) => {
  const { t } = useI18n();
  const list = useApi('/insights/at-risk');
  const students = list.data ?? [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span>
            {t('atRisk.cardTitle')}
            {list.data ? ` (${students.length})` : ''}
          </span>
        </h2>
        <Link to={linkTo} className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:underline">
          {t('common.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <AsyncState state={list} loadingText={t('atRisk.loading')}>
        {() =>
          students.length === 0 ? (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
              {t('atRisk.allGood')}
            </p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {students.slice(0, 3).map((s) => (
                <li key={s.studentId}>
                  <Link
                    to={`${profileBase}/${encodeURIComponent(s.studentId)}`}
                    className="block h-full rounded-2xl border border-slate-200/80 p-3 hover:border-[#FF6B2C] transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                      <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-black ${scoreTone(s.score)}`}>
                        {s.score}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {t('common.class')} {s.className}
                    </p>
                    <ReasonChips reasons={(s.reasons ?? []).slice(0, 2)} />
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncState>
    </div>
  );
};

/** Page body: optional class filter + the full list. `classes` = class ids the user may pick from. */
export const AtRiskView = ({ classes, profileBase }) => {
  const { t } = useI18n();
  const [className, setClassName] = useState('');
  const list = useApi(withQuery('/insights/at-risk', { className }));

  return (
    <div className="space-y-4">
      {classes?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-slate-500">{t('common.class')}:</label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
          >
            <option value="">{t('atRisk.allClasses')}</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ExportButton
            className="ml-auto"
            rows={list.data || []}
            fileBase="students-needing-attention"
            columns={[
              { label: 'Student ID', value: (s) => s.studentId },
              { label: 'Name', value: (s) => s.name },
              { label: 'Class', value: (s) => s.className },
              { label: 'Roll No', value: (s) => s.rollNumber },
              { label: 'Score', value: (s) => s.score },
              { label: 'Attendance %', value: (s) => s.attendanceRate },
              { label: 'Average Marks %', value: (s) => s.averageMarks },
              { label: 'Overdue Fees', value: (s) => s.overdueFees },
              { label: 'Homework Missed', value: (s) => s.missingHomework },
              { label: 'Reasons', value: (s) => (s.reasons || []).join('; ') },
            ]}
          />
        </div>
      )}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={list} loadingText={t('atRisk.loading')}>
          {(students) => <AtRiskList students={students} profileBase={profileBase} />}
        </AsyncState>
      </div>
      <p className="text-[11px] text-slate-400">{t('atRisk.explain')}</p>
    </div>
  );
};
