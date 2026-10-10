import React from 'react';
import { ROLES } from '@/constants/roles';
import { RoleCard } from './RoleCard';

export const RoleSelector = ({ selectedRoleId, onSelectRole }) => {
  return (
    <div className="w-full mt-4 sm:mt-5">
      <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-2.5">
        SELECT ROLE
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {ROLES.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isSelected={selectedRoleId === role.id}
            onSelect={onSelectRole}
          />
        ))}
      </div>
    </div>
  );
};
