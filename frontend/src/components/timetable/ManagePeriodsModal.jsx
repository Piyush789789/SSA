import React, { useState } from 'react';
import { X, Trash2, Plus, AlertCircle, Clock } from 'lucide-react';

export const ManagePeriodsModal = ({
  isOpen,
  periods,
  onClose,
  onAddPeriod,
  onDeletePeriod,
}) => {
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);

  const [error, setError] = useState('');
  const [periodToDelete, setPeriodToDelete] = useState(null);

  if (!isOpen) return null;

  const handleAddPeriod = (e) => {
    e.preventDefault();
    setError('');

    if (!label.trim()) {
      setError('Please enter a period label.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please provide both Start Time and End Time.');
      return;
    }
    if (startTime >= endTime) {
      setError('End Time must be after Start Time.');
      return;
    }

    // Check for overlap
    const hasOverlap = periods.some((p) => {
      return (
        (startTime >= p.startTime && startTime < p.endTime) ||
        (endTime > p.startTime && endTime <= p.endTime) ||
        (startTime <= p.startTime && endTime >= p.endTime)
      );
    });

    if (hasOverlap) {
      setError('This period overlaps with an existing time slot.');
      return;
    }

    onAddPeriod({
      id: `period-${Date.now()}`,
      label: label.trim(),
      startTime,
      endTime,
      type: isBreak ? 'break' : 'period',
    });

    // Reset form
    setLabel('');
    setStartTime('');
    setEndTime('');
    setIsBreak(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Manage Periods</h3>
              <p className="text-xs text-slate-500">Configure timetable rows and time slots</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
          {/* List of Existing Periods */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Current Rows ({periods.length})
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {periods.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{p.label}</span>
                        {p.type === 'break' && (
                          <span className="text-[10px] font-semibold text-amber-600 italic">
                            break
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {p.startTime} – {p.endTime}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPeriodToDelete(p)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete period row"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Period Confirmation Overlay */}
          {periodToDelete && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Delete Period "{periodToDelete.label}"?</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Deleting this period will remove this row from the timetable for all classes.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPeriodToDelete(null)}
                  className="px-3 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeletePeriod(periodToDelete.id);
                    setPeriodToDelete(null);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Delete Period
                </button>
              </div>
            </div>
          )}

          {/* Add New Row Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Add New Row
            </h4>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-xs font-medium p-3 rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddPeriod} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Period 8, Lunch, Assembly"
                  className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-2xl text-xs border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-2xl text-xs border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBreak}
                  onChange={(e) => setIsBreak(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer"
                />
                <span>This is a break / lunch (not editable in timetable)</span>
              </label>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Period</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
