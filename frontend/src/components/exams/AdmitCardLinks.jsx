import React from 'react';
import { Link } from 'react-router-dom';
import { IdCard } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/utils';

/**
 * "Admit card" links for the student's upcoming / ongoing exams (student and parent portals). Shows nothing
 * when there is no such exam.
 */
export const AdmitCardLinks = ({ student }) => {
  const exams = useApi(student?.className ? '/exams' : null);
  const upcoming = (exams.data ?? [])
    .filter((e) => e.status !== 'Completed' && (e.classes ?? []).includes(student.className))
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));

  if (!student || upcoming.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
        <IdCard className="w-5 h-5 text-[#FF6B2C]" /> Admit cards
      </h2>
      <div className="flex flex-wrap gap-2">
        {upcoming.map((exam) => (
          <Link
            key={exam.id}
            to={`/admit-cards/${encodeURIComponent(exam.id)}?studentId=${encodeURIComponent(student.studentId ?? student.id)}`}
            className="inline-flex flex-col rounded-2xl border border-slate-200 px-4 py-2.5 hover:border-[#FF6B2C] hover:bg-[#FFF5F0]"
          >
            <span className="text-xs font-bold text-slate-900">{exam.name}</span>
            <span className="text-[11px] font-semibold text-slate-500">
              {formatDate(exam.startDate)} · View / print admit card
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdmitCardLinks;
