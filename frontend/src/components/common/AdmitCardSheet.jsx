import React from 'react';
import { SchoolLetterhead } from '@/components/common/SchoolLetterhead';
import { EmptyMessage } from '@/components/common/AsyncState';
import { formatDate, weekdayName } from '@/utils';

const Detail = ({ label, value }) => (
  <div className="flex gap-2 text-[11px] leading-5">
    <span className="w-24 shrink-0 font-semibold text-slate-500">{label}</span>
    <span className="font-bold text-slate-900 border-b border-dotted border-slate-300 flex-1 min-w-0 truncate">{value || '—'}</span>
  </div>
);

/** One admit card: letterhead, exam, student details with photo box, room & seat, papers, signatures. */
export const AdmitCard = ({ school, exam, card }) => {
  const s = card.student || {};
  const papers = [...(card.papers || [])].sort(
    (a, b) => String(a.date).localeCompare(String(b.date)) || String(a.startTime).localeCompare(String(b.startTime)),
  );

  return (
    <div className="admit-card bg-white border-2 border-slate-800 rounded-xl p-4 space-y-3 text-slate-900">
      <SchoolLetterhead school={school} title="Admit Card" subtitle={exam?.name} />

      <div className="flex gap-4">
        <div className="flex-1 min-w-0 space-y-0.5">
          <Detail label="Student name" value={s.name} />
          <Detail label="Class" value={s.className} />
          <Detail label="Roll no." value={s.rollNumber} />
          <Detail label="Admission no." value={s.id} />
          <Detail label="Date of birth" value={s.dateOfBirth ? formatDate(s.dateOfBirth) : null} />
          <div className="flex gap-6 pt-1.5">
            <p className="text-[11px]">
              <span className="font-semibold text-slate-500">Room: </span>
              <span className="font-extrabold">{card.room || 'To be announced'}</span>
            </p>
            <p className="text-[11px]">
              <span className="font-semibold text-slate-500">Seat no.: </span>
              <span className="font-extrabold">{card.seatNumber ?? '—'}</span>
            </p>
          </div>
        </div>
        <div className="w-[26mm] h-[32mm] min-w-[88px] min-h-[108px] border border-dashed border-slate-400 flex items-center justify-center text-[10px] font-semibold text-slate-400 text-center shrink-0">
          Affix passport-size photo
        </div>
      </div>

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-2 py-1 text-left">Date</th>
            <th className="border border-slate-300 px-2 py-1 text-left">Day</th>
            <th className="border border-slate-300 px-2 py-1 text-left">Time</th>
            <th className="border border-slate-300 px-2 py-1 text-left">Subject</th>
          </tr>
        </thead>
        <tbody>
          {papers.length === 0 ? (
            <tr>
              <td colSpan={4} className="border border-slate-300 px-2 py-1 text-center text-slate-500">
                No papers scheduled yet.
              </td>
            </tr>
          ) : (
            papers.map((p) => (
              <tr key={p.id ?? `${p.subject}-${p.date}`}>
                <td className="border border-slate-300 px-2 py-1 whitespace-nowrap">{formatDate(p.date)}</td>
                <td className="border border-slate-300 px-2 py-1">{weekdayName(p.date)}</td>
                <td className="border border-slate-300 px-2 py-1 whitespace-nowrap">
                  {p.startTime}
                  {p.endTime ? ` – ${p.endTime}` : ''}
                </td>
                <td className="border border-slate-300 px-2 py-1 font-semibold">{p.subject}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex justify-between gap-6 pt-6 text-[11px] font-bold text-slate-700">
        <span className="border-t border-slate-500 pt-1 px-4">Signature of the student</span>
        <span className="border-t border-slate-500 pt-1 px-4">Principal</span>
      </div>
    </div>
  );
};

/**
 * Printable admit cards from GET /exams/{id}/admit-cards: `{school, exam, className, cards}`.
 * Cards are grouped two per A4 page when printing.
 */
export const AdmitCardsSheet = ({ data }) => {
  const cards = data?.cards ?? [];
  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <EmptyMessage text="No admit cards for this exam." />
      </div>
    );
  }
  const pages = [];
  for (let i = 0; i < cards.length; i += 2) pages.push(cards.slice(i, i + 2));

  return (
    <div className="print-sheet space-y-6">
      {pages.map((pair, i) => (
        <div key={i} className="admit-card-page space-y-6">
          {pair.map((card) => (
            <AdmitCard key={card.student?.id} school={data.school} exam={data.exam} card={card} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default AdmitCardsSheet;
