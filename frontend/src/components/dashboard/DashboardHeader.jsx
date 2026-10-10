import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ChevronDown, Building2, LogOut, Mail } from 'lucide-react';
import { APP_CONFIG } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { initialsOf } from '@/utils';

export const DashboardHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const name = currentUser?.name || 'Admin';
  const initials = initialsOf(name) || 'A';

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // The global search opens the Students page filtered by the typed name / roll number / ID.
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `${ROUTES.ADMIN_STUDENTS}?q=${encodeURIComponent(q)}` : ROUTES.ADMIN_STUDENTS);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

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
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students by name, roll no. or ID..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all"
          />
        </form>
      </div>

      {/* Right User Actions & Avatar Section */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* School Name Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700">
          <Building2 className="w-4 h-4 text-[#FF6B2C] stroke-[2]" />
          <span className="truncate max-w-[180px] lg:max-w-[240px]">{APP_CONFIG.schoolName}</span>
        </div>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-2xl p-1 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-orange-100">
              {initials}
            </div>
            <span className="hidden md:block text-xs font-bold text-slate-800 max-w-[140px] truncate">{name}</span>
            <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-400 stroke-[2]" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 z-40 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 text-xs"
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-extrabold text-slate-900 text-sm truncate">{name}</p>
                <p className="text-slate-400 font-medium mt-0.5">School Administrator</p>
                {currentUser?.email && (
                  <p className="flex items-center gap-1.5 text-slate-500 mt-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 font-bold hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
