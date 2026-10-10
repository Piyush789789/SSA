import React from 'react';
import { Pencil, Trash2, Calendar, User } from 'lucide-react';
import { PriorityBadge, PriorityIcon } from './PriorityBadge';

export const NoticeCard = ({ notice, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        {/* Top Header Row: Icon, Title, Badge & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Priority Icon */}
            <PriorityIcon priority={notice.priority} />

            {/* Title & Priority Badge */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                {notice.title}
              </h3>
              <PriorityBadge priority={notice.priority} />
            </div>
          </div>

          {/* Edit / Delete Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(notice)}
              aria-label="Edit notice"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Notice"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(notice)}
              aria-label="Delete notice"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Notice"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-8">
          {notice.description}
        </p>
      </div>

      {/* Footer Metadata (Date & Author) */}
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-3 border-t border-slate-100 pl-8">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{notice.createdAt}</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>By {notice.author || 'School Admin'}</span>
        </div>
      </div>
    </div>
  );
};
