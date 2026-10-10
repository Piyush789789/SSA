import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Eye, Edit3, Trash2 } from 'lucide-react';
import { StudentStatusBadge } from './StudentStatusBadge';

export const StudentRow = ({ student }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewStudent = () => {
    setIsMenuOpen(false);
    navigate(`/admin/students/${student.id}`);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
      {/* Student Details (Avatar, Name, Email) */}
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100/70 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
            {student.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 leading-snug truncate">
              {student.name}
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              {student.email}
            </div>
          </div>
        </div>
      </td>

      {/* Class */}
      <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-slate-700 whitespace-nowrap">
        {student.className}
      </td>

      {/* Roll No. */}
      <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-slate-700 whitespace-nowrap">
        {student.rollNumber}
      </td>

      {/* Attendance Visual Bar & % */}
      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
        <div className="flex items-center gap-3 max-w-[140px]">
          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#FF6B2C] h-full rounded-full transition-all duration-300"
              style={{ width: `${student.attendance}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 w-9 text-right">
            {student.attendance}%
          </span>
        </div>
      </td>

      {/* Fee Status */}
      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
        <StudentStatusBadge status={student.feeStatus} />
      </td>

      {/* Actions */}
      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Actions menu"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {/* Action Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-6 top-12 z-20 w-40 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1 text-left text-xs font-medium text-slate-700">
            <button
              onClick={handleViewStudent}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>View Student</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Student</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete Student</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
