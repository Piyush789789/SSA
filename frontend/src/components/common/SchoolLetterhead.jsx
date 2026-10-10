import React from 'react';
import { GraduationCap } from 'lucide-react';

/** School letterhead for printable sheets, from the `school` settings object returned by the backend. */
export const SchoolLetterhead = ({ school, title, subtitle }) => {
  const s = school || {};
  const contact = [s.phone && `Phone: ${s.phone}`, s.email && `Email: ${s.email}`].filter(Boolean).join('  ·  ');
  const registration = [
    s.board && `Affiliated to ${s.board}`,
    s.affiliationNo && `Affiliation No. ${s.affiliationNo}`,
    s.udiseCode && `UDISE Code ${s.udiseCode}`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
      <div className="flex items-center justify-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
          {s.schoolName || 'School'}
        </h2>
      </div>
      {s.address && <p className="text-xs font-semibold text-slate-600">{s.address}</p>}
      {contact && <p className="text-[11px] text-slate-500">{contact}</p>}
      {registration && <p className="text-[11px] font-semibold text-slate-600">{registration}</p>}
      {title && (
        <h3 className="pt-3 text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-widest">{title}</h3>
      )}
      {subtitle && <p className="text-xs font-bold text-slate-600">{subtitle}</p>}
    </div>
  );
};

export default SchoolLetterhead;
