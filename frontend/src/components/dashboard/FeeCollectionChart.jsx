import React, { useMemo } from 'react';
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
import { monthKey } from './dashboardDates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Money collected per month over the last 6 months, summed from GET /fees/payments. */
export const FeeCollectionChart = ({ payments = [], today, months = 6 }) => {
  const chartData = useMemo(() => {
    const totals = new Map();
    payments.forEach((p) => {
      const key = String(p.paidAt).slice(0, 7);
      totals.set(key, (totals.get(key) || 0) + Number(p.amount || 0));
    });
    return Array.from({ length: months }, (_, i) => {
      const key = monthKey(today, months - 1 - i);
      const isCurrent = i === months - 1;
      return {
        month: MONTHS[Number(key.slice(5, 7)) - 1],
        amount: totals.get(key) || 0,
        color: isCurrent ? '#06B6D4' : '#FF7A45',
      };
    });
  }, [payments, today, months]);

  const formatYAxis = (value) => {
    if (value === 0) return '0';
    if (value >= 10000000) return `${value / 10000000}Cr`;
    if (value >= 100000) return `${value / 100000}L`;
    if (value >= 1000) return `${value / 1000}k`;
    return value;
  };

  const formatTooltip = (value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collected'];

  const hasPayments = chartData.some((d) => d.amount > 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Fee Collection
        </h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
          Last {months} months
        </span>
      </div>

      {hasPayments ? (
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
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
                {chartData.map((entry) => (
                  <Cell key={entry.month} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-slate-400 font-medium">
          No fee payments recorded in the last {months} months.
        </div>
      )}
    </div>
  );
};
