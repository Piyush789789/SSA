import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { feeCollectionData } from '@/data/dashboardData';

export const FeeCollectionChart = () => {
  const formatYAxis = (value) => {
    if (value === 0) return '0';
    if (value >= 1000000) return `${value / 1000000}M`;
    if (value >= 1000) return `${value / 1000}k`;
    return value;
  };

  const formatTooltip = (value) => {
    return [`₹${value.toLocaleString('en-IN')}`, 'Collected'];
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Fee Collection
        </h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
          Monthly
        </span>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={feeCollectionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              domain={[0, 1000000]}
              ticks={[0, 250000, 500000, 750000, 1000000]}
              tickFormatter={formatYAxis}
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
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              formatter={formatTooltip}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={44}>
              {feeCollectionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
