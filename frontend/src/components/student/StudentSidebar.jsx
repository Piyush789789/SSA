import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, X, LogOut } from 'lucide-react';
import { STUDENT_SIDEBAR_ITEMS } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';

export const StudentSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleNavigation = (route) => {
    if (onClose) onClose();
    navigate(route);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentName = currentUser?.name || 'Rohit Verma';
  const studentAvatar = currentUser?.avatar || currentUser?.initials || 'RV';

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
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/student/dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C] flex items-center justify-center text-white shadow-md shadow-[#FF6B2C]/20 shrink-0">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-slate-900 text-sm leading-tight tracking-tight truncate">
                EduFlow
              </h1>
              <p className="font-bold text-[#FF6B2C] text-xs leading-tight truncate">
                Student
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            NAVIGATION
          </div>

          {STUDENT_SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.route || (item.route !== '/student/dashboard' && location.pathname.startsWith(item.route));

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.route)}
                className={`w-full relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#FFF5F0] text-[#FF6B2C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {/* Active left indicator pill */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#FF6B2C] rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 stroke-[2.2] shrink-0 ${
                    isActive ? 'text-[#FF6B2C]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Student Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
              onClick={() => navigate('/student/profile')}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-orange-100 shrink-0">
                {studentAvatar}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {studentName}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 truncate">
                  Class {currentUser?.className || '5-B'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
