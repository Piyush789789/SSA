import React from 'react';
import { Users, GraduationCap, CalendarCheck, IndianRupee } from 'lucide-react';

const ICON_MAP = {
  students: Users,
  teachers: GraduationCap,
  attendance: CalendarCheck,
  fees: IndianRupee,
};

export const StatCard = ({ stat }) => {
  const Icon = ICON_MAP[stat.type] || Users;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white bg-gradient-to-r ${stat.gradient} shadow-md shadow-slate-200/50 flex items-center justify-between transition-transform duration-200 hover:-translate-y-0.5`}
    >
      <div className="relative z-10">
        <span className="text-xs sm:text-sm font-medium text-white/90 block mb-1">
          {stat.title}
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {stat.value}
        </div>
      </div>

      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${stat.iconBg || 'bg-white/20'} backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner`}
      >
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
      </div>
    </div>
  );
};
