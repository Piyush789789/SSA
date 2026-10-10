import React from 'react';
import { subjectColors } from './subjectColors';

/** Subjects of the shown timetable; clicking one highlights its periods. */
export const SubjectLegend = ({ subjects = [], selectedSubject, onSelectSubject }) => {
  if (subjects.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {subjects.map((subject) => {
        const isSelected = selectedSubject === subject;
        return (
          <button
            key={subject}
            type="button"
            onClick={() => onSelectSubject(isSelected ? null : subject)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer ${
              subjectColors(subject).badgeClass
            } ${isSelected ? 'ring-2 ring-offset-1 ring-[#FF6B2C] shadow-sm scale-105' : 'hover:opacity-90'}`}
          >
            {subject}
          </button>
        );
      })}
    </div>
  );
};
