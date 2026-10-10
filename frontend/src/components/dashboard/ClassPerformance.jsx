import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { classPerformanceData } from '@/data/dashboardData';

export const ClassPerformance = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Class Performance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Average academic score percentage by grade</p>
        </div>
        <span className="text-xs font-semibold text-[#FF6B2C] bg-[#FFF5F0] px-2.5 py-1 rounded-lg border border-[#FF6B2C]/20">
          Demo Overview
        </span>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={classPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="class"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
              }}
              formatter={(value) => [`${value}% Avg Score`, 'Performance']}
            />
            <Bar dataKey="score" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
