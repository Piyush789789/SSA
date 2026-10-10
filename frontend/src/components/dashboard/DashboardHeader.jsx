import React from 'react';
import { Menu, Search, Bell, ChevronDown, Building2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/env';

export const DashboardHeader = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left Search & Toggle Section */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            placeholder="Search students, classes..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all"
          />
        </div>
      </div>

      {/* Right User Actions & Avatar Section */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B2C] rounded-full ring-2 ring-white" />
        </button>

        {/* School Selector Dropdown Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
          <Building2 className="w-4 h-4 text-[#FF6B2C] stroke-[2]" />
          <span className="truncate max-w-[180px] lg:max-w-[240px]">{APP_CONFIG.schoolName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
        </div>

        {/* User Avatar Circle */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-orange-100 cursor-pointer">
            SA
          </div>
        </div>
      </div>
    </header>
  );
};
