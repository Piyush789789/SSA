import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  Award,
  BookOpenCheck,
  Megaphone,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { http } from '@/api/http';
import { formatDateTime } from '@/utils';

const POLL_MS = 60_000;

/** Where each notification "link" hint (e.g. "/fees") goes in each portal. Missing = not clickable to a page. */
const NOTIFICATION_LINKS = {
  admin: {
    '/fees': '/fees',
    '/attendance': '/admin/attendance',
    '/results': '/admin/exams',
    '/notices': '/admin/notices',
    '/leaves': '/admin/leaves',
    '/calendar': '/admin/calendar',
    '/timetable': '/admin/substitutions',
  },
  teacher: {
    '/attendance': '/teacher/attendance',
    '/results': '/teacher/exams',
    '/homework': '/teacher/homework',
    '/notices': '/teacher/notices',
    '/messages': '/teacher/communication',
    '/leaves': '/teacher/leave',
    '/calendar': '/teacher/calendar',
    '/timetable': '/teacher/dashboard',
  },
  student: {
    '/fees': '/student/fees',
    '/attendance': '/student/attendance',
    '/results': '/student/exams',
    '/homework': '/student/homework',
    '/notices': '/student/notices',
    '/messages': '/student/communication',
    '/leaves': '/student/leave',
    '/calendar': '/student/calendar',
  },
  parent: {
    '/fees': '/parent/fees',
    '/attendance': '/parent/attendance',
    '/results': '/parent/results',
    '/homework': '/parent/homework',
    '/notices': '/parent/notices',
    '/messages': '/parent/communication',
    '/leaves': '/parent/leave',
    '/calendar': '/parent/calendar',
  },
};

const CATEGORY_ICONS = {
  ATTENDANCE: { icon: CalendarCheck, className: 'bg-emerald-50 text-emerald-600' },
  FEES: { icon: CreditCard, className: 'bg-orange-50 text-[#FF6B2C]' },
  FEE_REMINDER: { icon: CreditCard, className: 'bg-rose-50 text-rose-600' },
  RESULTS: { icon: Award, className: 'bg-indigo-50 text-indigo-600' },
  HOMEWORK: { icon: BookOpenCheck, className: 'bg-sky-50 text-sky-600' },
  NOTICE: { icon: Megaphone, className: 'bg-amber-50 text-amber-600' },
  MESSAGE: { icon: MessageSquare, className: 'bg-violet-50 text-violet-600' },
};

/** Maps a link hint like "/fees?due=12" to a route of this portal, or null. */
const resolveLink = (link, links) => {
  if (!link) return null;
  const path = String(link).split(/[?#]/)[0];
  const key = Object.keys(links).find((hint) => path === hint || path.startsWith(`${hint}/`));
  return key ? links[key] : null;
};

/**
 * Header bell: unread badge (refreshed every minute) and a dropdown with the latest notifications.
 * Clicking one marks it read and opens the matching page of the portal (`portal` = admin|teacher|student|parent).
 */
export const NotificationBell = ({ portal }) => {
  const navigate = useNavigate();
  const links = NOTIFICATION_LINKS[portal] || {};
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const data = await http.get('/notifications/unread-count');
      setUnread(Number(data?.unread) || 0);
    } catch {
      // Keep the last known count; the bell must never break the header.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await http.get('/notifications?limit=50');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      loadList();
      refreshCount();
    }
  };

  const markRead = async (item) => {
    if (item.readAt) return;
    try {
      await http.post(`/notifications/${item.id}/read`);
      setItems((list) => (list || []).map((n) => (n.id === item.id ? { ...n, readAt: n.readAt || 'now' } : n)));
      setUnread((count) => Math.max(0, count - 1));
    } catch {
      // Not critical; the next refresh shows the real state.
    }
  };

  const openItem = async (item) => {
    await markRead(item);
    const target = resolveLink(item.link, links);
    if (target) {
      setIsOpen(false);
      navigate(target);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await http.post('/notifications/read-all');
      setItems((list) => (list || []).map((n) => ({ ...n, readAt: n.readAt || 'now' })));
      setUnread(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
        aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 stroke-[2]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#FF6B2C] text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Notifications</p>
              <p className="text-[11px] text-slate-400 font-medium">{unread ? `${unread} unread` : 'All caught up'}</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || unread === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#FF6B2C] hover:bg-[#FFF5F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          </div>

          {error && <p className="px-4 py-2 text-[11px] font-semibold text-red-700 bg-red-50">{error}</p>}

          <div className="max-h-[420px] overflow-y-auto">
            {loading && !items ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" /> Loading…
              </div>
            ) : !items || items.length === 0 ? (
              !error && (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-xs text-slate-400">
                  <BellOff className="w-6 h-6" />
                  No notifications yet.
                </div>
              )
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const style = CATEGORY_ICONS[item.category] || { icon: Bell, className: 'bg-slate-100 text-slate-500' };
                  const Icon = style.icon;
                  const isUnread = !item.readAt;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer ${
                          isUnread ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.className}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block text-xs truncate ${isUnread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-600'}`}
                          >
                            {item.title}
                          </span>
                          {item.body && (
                            <span className={`block text-[11px] mt-0.5 line-clamp-2 ${isUnread ? 'text-slate-700' : 'text-slate-500'}`}>
                              {item.body}
                            </span>
                          )}
                          <span className="block text-[10px] text-slate-400 mt-1">{formatDateTime(item.createdAt)}</span>
                        </span>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-[#FF6B2C] mt-1.5 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
