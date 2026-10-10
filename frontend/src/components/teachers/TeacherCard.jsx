import React from 'react';
import { Pencil, Trash2, Mail, Phone, GraduationCap, Building2 } from 'lucide-react';

export const TeacherCard = ({ teacher, onEdit, onDelete }) => {
  // Generate initials
  const getInitials = (name) => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const initials = getInitials(teacher.name);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      <div>
        {/* Top Header Row: Avatar, Info, Actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circular Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#FFF5F0] text-[#FF6B2C] font-extrabold text-sm flex items-center justify-center shrink-0 border border-[#FF6B2C]/20 shadow-inner">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                {teacher.name}
              </h3>
              {/* Subject Badge */}
              <div className="mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF5F0] text-[#FF6B2C] border border-[#FF6B2C]/20">
                  {teacher.subject}
                </span>
              </div>
            </div>
          </div>

          {/* Action Icons (Edit / Delete) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(teacher)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Teacher"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(teacher)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Teacher"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Contact & Detail Items */}
        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{teacher.email}</span>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{teacher.phone || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{teacher.qualification || 'B.Ed'}</span>
          </div>
        </div>
      </div>

      {/* Assigned Classes Section */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Assigned Classes</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
            teacher.assignedClasses.map((cls) => (
              <span
                key={cls}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-slate-700 border border-orange-100"
              >
                {cls}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No classes assigned</span>
          )}
        </div>
      </div>
    </div>
  );
};
