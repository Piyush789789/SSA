import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { SIDEBAR_ITEMS } from '@/constants/sidebar';
import { APP_CONFIG } from '@/config/env';
import { ROUTES } from '@/constants/routes';

export const Sidebar = ({ activeItemId = 'dashboard', onItemSelect, isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleNavigation = (itemId) => {
    let targetRoute = null;

    if (itemId === 'dashboard') {
      targetRoute = ROUTES.ADMIN_DASHBOARD;
    } else if (itemId === 'students') {
      targetRoute = ROUTES.ADMIN_STUDENTS;
    } else if (itemId === 'classes') {
      targetRoute = ROUTES.ADMIN_CLASSES;
    } else if (itemId === 'teachers') {
      targetRoute = ROUTES.ADMIN_TEACHERS;
    } else if (itemId === 'attendance') {
      targetRoute = ROUTES.ADMIN_ATTENDANCE;
    } else if (itemId === 'fees') {
      targetRoute = ROUTES.FEES;
    } else if (itemId === 'timetable') {
      targetRoute = ROUTES.TIMETABLE;
    } else if (itemId === 'notice-board' || itemId === 'notices') {
      targetRoute = ROUTES.ADMIN_NOTICES;
    } else if (itemId === 'exams' || itemId === 'tests-exams') {
      targetRoute = ROUTES.ADMIN_EXAMS;
    } else if (itemId === 'roles-permissions' || itemId === 'roles') {
      targetRoute = ROUTES.ADMIN_ROLES_PERMISSIONS;
    }

    if (onClose) onClose();

    if (targetRoute) {
      navigate(targetRoute);
    } else if (onItemSelect) {
      onItemSelect(itemId);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[300px] lg:w-[310px] bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C] flex items-center justify-center text-white shadow-md shadow-[#FF6B2C]/20 shrink-0">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight tracking-tight truncate">
                SSA SHIV SHANTI
              </h1>
              <p className="font-bold text-slate-800 text-[11px] leading-tight truncate">
                ADARSH ACADEMY
              </p>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                School Admin
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
            NAVIGATION
          </div>

          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeItemId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#FFF5F0] text-[#FF6B2C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 stroke-[2.2] ${
                    isActive ? 'text-[#FF6B2C]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
          {APP_CONFIG.appName} v1.0.0
        </div>
      </aside>
    </>
  );
};
