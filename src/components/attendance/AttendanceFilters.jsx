import React from 'react';
import { Search, Download, Calendar as CalendarIcon, CheckSquare, RotateCcw } from 'lucide-react';
import { CLASSES_LIST } from '@/data/attendanceData';

export const AttendanceFilters = ({
  filterState,
  onFilterChange,
  onResetFilters,
  onExportCSV,
  onOpenMarkModal,
}) => {
  const { viewMode, selectedDate, selectedWeek, selectedMonth, selectedClass, searchQuery } = filterState;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: View Mode + Date Controls + Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: View Mode Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          {['daily', 'weekly', 'monthly'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onFilterChange('viewMode', mode)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {mode} View
            </button>
          ))}
        </div>

        {/* Middle: Date / Week / Month Control */}
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-[#FF6B2C] shrink-0" />
          {viewMode === 'daily' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onFilterChange('selectedDate', e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all"
              />
            </div>
          )}

          {viewMode === 'weekly' && (
            <select
              value={selectedWeek}
              onChange={(e) => onFilterChange('selectedWeek', e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all"
            >
              <option value="2026-W39">Week: 21 Sep – 26 Sep 2026</option>
              <option value="2026-W38">Week: 14 Sep – 19 Sep 2026</option>
              <option value="2026-W37">Week: 07 Sep – 12 Sep 2026</option>
            </select>
          )}

          {viewMode === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => onFilterChange('selectedMonth', e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all"
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
            </select>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenMarkModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-[#FF6B2C]/20"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Class Dropdown + Search Input */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
        {/* Class Filter */}
        <div className="sm:col-span-4 lg:col-span-3">
          <select
            value={selectedClass}
            onChange={(e) => onFilterChange('selectedClass', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all"
          >
            <option value="ALL">All Classes</option>
            {CLASSES_LIST.map((c) => (
              <option key={c.id} value={c.name}>
                Class {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Student */}
        <div className="sm:col-span-8 lg:col-span-9 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="Search by student name, roll no. or student ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all"
          />
        </div>
      </div>
    </div>
  );
};
