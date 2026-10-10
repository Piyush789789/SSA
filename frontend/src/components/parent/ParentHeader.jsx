import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ChevronDown, Building2, User, Settings, LogOut, Users, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from '@/components/common/NotificationBell';
import { LanguageSwitch } from '@/components/common/LanguageSwitch';
import { useI18n } from '@/i18n/translate';

export const ParentHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, selectedChild, switchChild, logout } = useAuth();
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedSchool = 'My School';
  const dropdownRef = useRef(null);

  const avatarText = currentUser?.avatar || '';
  const linkedChildren = currentUser?.linkedChildren || [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left Search & Sidebar Toggle */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Global Search Bar (Matching Screenshot) */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            placeholder="Search students, classes..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all"
          />
        </div>
      </div>

      {/* Right Actions, School Selector & Avatar Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Notification Bell */}
        <LanguageSwitch />
        <NotificationBell portal="parent" />

        {/* School Selector Dropdown Pill (Matching Screenshot) */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
          <Building2 className="w-4 h-4 text-[#FF6B2C] stroke-[2]" />
          <span>{selectedSchool}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-orange-100 hover:ring-orange-300 transition-all cursor-pointer"
            aria-label="Parent Profile Menu"
          >
            {avatarText}
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name} (Parent)
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.email}
                </p>
                {selectedChild && (
                  <p className="text-[10px] font-semibold text-[#FF6B2C] truncate mt-0.5">
                    Viewing: {selectedChild.name} (Class {selectedChild.className})
                  </p>
                )}
              </div>

              {/* Child Switcher in Dropdown */}
              {linkedChildren.length > 1 && (
                <div className="py-1 border-b border-slate-100 px-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    {t('common.selectChild')}
                  </div>
                  {linkedChildren.map((child) => (
                    <button
                      key={child.studentId}
                      onClick={() => {
                        switchChild(child.studentId);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        selectedChild?.studentId === child.studentId
                          ? 'bg-[#FFF5F0] text-[#FF6B2C]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-[#EA580C] text-[10px] font-bold flex items-center justify-center">
                          {child.avatar}
                        </span>
                        <span>{child.name} (Class {child.className})</span>
                      </div>
                      {selectedChild?.studentId === child.studentId && (
                        <Check className="w-3.5 h-3.5 text-[#FF6B2C]" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/parent/profile');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>{t('common.parentProfile')}</span>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/parent/communication');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>{t('common.teacherMessages')}</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ParentHeader;
