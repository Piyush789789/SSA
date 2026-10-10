import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, Building2, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const TeacherHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('Shiv Shanti Adarsh Academy');
  const dropdownRef = useRef(null);

  const teacherAvatar = currentUser?.avatar || 'AS';

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

      {/* Right Actions, School Selector & Avatar Dropdown */}
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
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
          <Building2 className="w-4 h-4 text-[#FF6B2C] stroke-[2]" />
          <span>{selectedSchool}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
        </div>

        {/* Teacher Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-orange-100 hover:ring-orange-300 transition-all cursor-pointer"
            aria-label="Teacher Profile Menu"
          >
            {teacherAvatar}
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name || 'Anjali Singh'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.email || 'anjali.singh@teacher.example'}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/teacher/profile');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400 stroke-[2]" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400 stroke-[2]" />
                <span>Settings</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[2]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
