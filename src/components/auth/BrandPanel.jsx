import React from 'react';
import { GraduationCap } from 'lucide-react';
import { APP_CONFIG } from '@/config/env';

export const BrandPanel = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#FF5C1B] via-[#FA6B2D] to-[#E04E15] text-white p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between h-full min-h-[340px] lg:min-h-full">
      {/* Background subtle decorative pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-md">
          <GraduationCap className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-xs sm:text-base leading-tight tracking-tight">
            {APP_CONFIG.schoolName}
          </h1>
          <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
            {APP_CONFIG.appName}
          </p>
        </div>
      </div>

      {/* Hero Content Section */}
      <div className="relative z-10 my-6 lg:my-auto max-w-lg">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-3">
          Manage your school with confidence
        </h2>
        <p className="text-white/85 text-xs sm:text-sm lg:text-base leading-relaxed font-normal max-w-md">
          A complete platform for administrators, teachers, students, and parents.
        </p>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mt-6 sm:mt-8">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-white shadow-sm transition-transform hover:scale-[1.02]">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">1,000+</div>
            <div className="text-[10px] sm:text-xs font-medium text-white/80 mt-0.5">Students</div>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-white shadow-sm transition-transform hover:scale-[1.02]">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">50+</div>
            <div className="text-[10px] sm:text-xs font-medium text-white/80 mt-0.5">Teachers</div>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-white shadow-sm transition-transform hover:scale-[1.02]">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">1</div>
            <div className="text-[10px] sm:text-xs font-medium text-white/80 mt-0.5">School</div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="relative z-10 text-[11px] sm:text-xs text-white/60 font-medium">
        &copy; {new Date().getFullYear()} {APP_CONFIG.schoolName}. All rights reserved.
      </div>
    </div>
  );
};
