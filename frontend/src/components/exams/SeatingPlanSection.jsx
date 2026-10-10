import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Armchair, CheckCircle2, IdCard, Loader2, Plus, Printer, Trash2, X } from 'lucide-react';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';

const newRoom = () => ({ key: Math.random().toString(36).slice(2), room: '', capacity: '' });

/**
 * Admin exam page: arrange the exam's seating (rooms + capacity, classes alternate seat by seat), print the
 * room-wise list, and print admit cards per class.
 */
export const SeatingPlanSection = ({ exam }) => {
  const plan = useApi(`/exams/${encodeURIComponent(exam.id)}/seating`);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Armchair className="w-5 h-5 text-[#FF6B2C]" /> Seating plan & admit cards
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          List the exam rooms and how many students each seats, then arrange. Seats alternate between classes.
        </p>
      </div>
      <div className="p-5">
        <AsyncState state={plan} loadingText="Loading seating plan…">
          {(data) => <SeatingEditor exam={exam} plan={data} onChanged={plan.reload} setPlan={plan.setData} />}
        </AsyncState>
      </div>
    </div>
  );
};

const SeatingEditor = ({ exam, plan, setPlan, onChanged }) => {
  const existingRooms = plan?.rooms ?? [];
  const [rooms, setRooms] = useState(() =>
    existingRooms.length
      ? existingRooms.map((r) => ({ key: r.room, room: r.room, capacity: String(r.capacity) }))
      : [newRoom()],
  );
  const [classes, setClasses] = useState(() => {
    const seated = new Set(existingRooms.flatMap((r) => r.seats.map((s) => s.className)));
    return seated.size ? exam.classes.filter((c) => seated.has(c)) : [...exam.classes];
  });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const capacity = rooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  const updateRoom = (key, patch) => setRooms((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const toggleClass = (c) => setClasses((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  const arrange = async () => {
    const body = {
      rooms: rooms
        .filter((r) => r.room.trim() || r.capacity)
        .map((r) => ({ room: r.room.trim(), capacity: Number(r.capacity) })),
      classes,
    };
    if (body.rooms.length === 0 || body.rooms.some((r) => !r.room || !(r.capacity >= 1))) {
      setError('Give every room a name and a capacity of at least 1.');
      return;
    }
    if (classes.length === 0) {
      setError('Choose at least one class.');
      return;
    }
    setBusy('arrange');
    setError('');
    setMessage('');
    try {
      const result = await http.put(`/exams/${encodeURIComponent(exam.id)}/seating`, body);
      setPlan(result);
      setMessage(`${result.seated} students seated in ${result.rooms.length} ${result.rooms.length === 1 ? 'room' : 'rooms'}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    if (!window.confirm('Clear the seating plan for this exam? Admit cards will no longer show rooms and seats.')) return;
    setBusy('clear');
    setError('');
    setMessage('');
    try {
      await http.delete(`/exams/${encodeURIComponent(exam.id)}/seating`);
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  const inputClass =
    'h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Rooms</span>
            <span className="text-[11px] font-semibold text-slate-400">Total capacity: {capacity}</span>
          </div>
          {rooms.map((r) => (
            <div key={r.key} className="flex gap-2">
              <input
                value={r.room}
                onChange={(e) => updateRoom(r.key, { room: e.target.value })}
                placeholder="Room (e.g. Hall A)"
                maxLength={40}
                className={inputClass}
              />
              <input
                type="number"
                min={1}
                value={r.capacity}
                onChange={(e) => updateRoom(r.key, { capacity: e.target.value })}
                placeholder="Seats"
                className={`${inputClass} max-w-[96px]`}
              />
              <button
                type="button"
                onClick={() => setRooms((list) => (list.length > 1 ? list.filter((x) => x.key !== r.key) : list))}
                disabled={rooms.length === 1}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                aria-label="Remove room"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRooms((list) => [...list, newRoom()])}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B2C] hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add room
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700">Classes to seat</span>
          <div className="flex flex-wrap gap-2">
            {exam.classes.map((c) => (
              <label
                key={c}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  classes.includes(c) ? 'border-[#FF6B2C] bg-[#FFF5F0] text-[#FF6B2C]' : 'border-slate-200 text-slate-500'
                }`}
              >
                <input type="checkbox" checked={classes.includes(c)} onChange={() => toggleClass(c)} className="accent-[#FF6B2C]" />
                Class {c}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={arrange}
          disabled={busy != null}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60 cursor-pointer"
        >
          {busy === 'arrange' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Armchair className="w-4 h-4" />}
          {existingRooms.length ? 'Re-arrange seats' : 'Arrange seats'}
        </button>
        {existingRooms.length > 0 && (
          <>
            <Link
              to={`/exam-seating/${encodeURIComponent(exam.id)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" /> Print room-wise list
            </Link>
            <button
              type="button"
              onClick={clear}
              disabled={busy != null}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
            >
              {busy === 'clear' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear plan
            </button>
          </>
        )}
      </div>

      {existingRooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {existingRooms.map((r) => {
            const byClass = {};
            r.seats.forEach((s) => {
              byClass[s.className] = (byClass[s.className] || 0) + 1;
            });
            return (
              <div key={r.room} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">{r.room}</p>
                  <p className="text-[11px] font-bold text-slate-500">
                    {r.seats.length}/{r.capacity} seats
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {Object.entries(byClass)
                    .map(([c, n]) => `${c}: ${n}`)
                    .join(' · ') || 'Empty'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-slate-700 mb-2">Print admit cards</p>
        <div className="flex flex-wrap gap-2">
          {exam.classes.map((c) => (
            <Link
              key={c}
              to={`/admit-cards/${encodeURIComponent(exam.id)}?className=${encodeURIComponent(c)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C]"
            >
              <IdCard className="w-4 h-4" /> Class {c}
            </Link>
          ))}
        </div>
        {existingRooms.length === 0 && (
          <p className="text-[11px] text-slate-400 mt-2">Without a seating plan the cards show no room or seat number.</p>
        )}
      </div>
    </div>
  );
};

export default SeatingPlanSection;
