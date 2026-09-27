import React from 'react';
import { SUBJECTS_LIST } from '@/data/timetableData';

export const SubjectLegend = ({ selectedSubjectId, onSelectSubject }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SUBJECTS_LIST.map((subject) => {
        const isSelected = selectedSubjectId === subject.id;
        return (
          <button
            key={subject.id}
            type="button"
            onClick={() => onSelectSubject(isSelected ? null : subject.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer ${
              subject.badgeClass
            } ${
              isSelected
                ? 'ring-2 ring-offset-1 ring-[#FF6B2C] shadow-sm scale-105'
                : 'hover:opacity-90'
            }`}
          >
            {subject.name}
          </button>
        );
      })}
    </div>
  );
};
