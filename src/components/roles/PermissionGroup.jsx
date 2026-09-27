import React from 'react';
import { PermissionToggle } from './PermissionToggle';

export const PermissionGroup = ({ group, currentPermissions, onToggle }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
        {group.label}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {group.permissions.map((permission) => (
          <PermissionToggle
            key={permission.id}
            permission={permission}
            isChecked={!!currentPermissions[permission.id]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
};
