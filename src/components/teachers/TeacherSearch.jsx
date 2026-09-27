import React from 'react';
import { Search } from 'lucide-react';

export const TeacherSearch = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative max-w-md w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search teachers..."
        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10 shadow-xs transition-all duration-200"
      />
    </div>
  );
};
