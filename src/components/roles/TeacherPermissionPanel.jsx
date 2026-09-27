import React from 'react';
import { Save } from 'lucide-react';
import { PERMISSION_GROUPS } from '@/data/permissionsData';
import { PermissionGroup } from './PermissionGroup';

export const TeacherPermissionPanel = ({
  teacher,
  currentPermissions,
  onTogglePermission,
  onSave,
  isDirty,
}) => {
  if (!teacher) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400 text-sm font-medium">Select a teacher to view and edit permissions.</p>
      </div>
    );
  }

  // Calculate active permissions dynamically
  const activeCount = Object.values(currentPermissions || {}).filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs flex flex-col h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
        <div>
          <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">
            {teacher.name}
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {teacher.email}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-bold text-amber-900 bg-amber-100/70 border border-amber-200/60 px-3 py-1.5 rounded-full">
            {activeCount} active
          </span>

          <button
            type="button"
            onClick={onSave}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
              isDirty
                ? 'bg-[#FF6B2C] hover:bg-[#e85a1c] shadow-[#FF6B2C]/25 ring-2 ring-[#FF6B2C]/20'
                : 'bg-[#FF6B2C] hover:bg-[#e85a1c] shadow-[#FF6B2C]/20'
            }`}
          >
            <Save className="w-4 h-4 stroke-[2.2]" />
            Save
          </button>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="flex-1 overflow-y-auto space-y-7 pr-1 custom-scrollbar max-h-[600px] lg:max-h-[calc(100vh-280px)]">
        {PERMISSION_GROUPS.map((group) => (
          <PermissionGroup
            key={group.id}
            group={group}
            currentPermissions={currentPermissions}
            onToggle={onTogglePermission}
          />
        ))}
      </div>
    </div>
  );
};
