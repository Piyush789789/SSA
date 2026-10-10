import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

export const StudentFilters = ({
  searchTerm,
  onSearchChange,
  selectedClass,
  onClassChange,
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 my-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or roll number..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all"
        />
      </div>

      {/* Class Filter Dropdown */}
      <div className="relative min-w-[140px]">
        <select
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          className="w-full h-11 appearance-none bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-700 pl-4 pr-9 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all cursor-pointer"
        >
          <option value="All">All Classes</option>
          <option value="1-A">1-A</option>
          <option value="1-B">1-B</option>
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
      </div>

      {/* Status Filter Dropdown */}
      <div className="relative min-w-[140px]">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full h-11 appearance-none bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-700 pl-4 pr-9 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
      </div>
    </div>
  );
};
