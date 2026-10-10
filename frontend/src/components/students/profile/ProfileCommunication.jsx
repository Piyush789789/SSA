import React, { useMemo, useState } from 'react';
import { Send, MessageSquare, Users } from 'lucide-react';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { formatDateTime } from '@/utils';

/**
 * Messages about this student (GET /messages filtered to this student's family or class) and a form to
 * message the family (POST /messages, recipientType STUDENT).
 */
export const ProfileCommunication = ({ student }) => {
  const messages = useApi('/messages');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const related = useMemo(
    () =>
      (messages.data || []).filter(
        (m) =>
          m.recipientId === student.id ||
          (m.recipientType === 'CLASS' && m.className === student.className),
      ),
    [messages.data, student.id, student.className],
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError({ message: 'Please enter a subject and a message.' });
      return;
    }
    setSaving(true);
    setError(null);
    setSent(false);
    try {
      await http.post('/messages', {
        recipientType: 'STUDENT',
        recipientId: student.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      setSubject('');
      setBody('');
      setSent(true);
      messages.reload();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Send message */}
        <div className="space-y-6">
          <form onSubmit={handleSend} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Message the Family</h3>
            <p className="text-xs text-slate-500">
              Sent to {student.name}&apos;s family inbox{student.guardian?.name ? ` (${student.guardian.name})` : ''}.
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-indigo-400 focus:outline-none"
            />
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-indigo-400 focus:outline-none"
            />
            {error && <p className="text-xs text-rose-600 font-medium">{error.message}</p>}
            {sent && <p className="text-xs text-emerald-600 font-medium">Message sent.</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" /> {saving ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Right Col - Communication History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Communication History</h3>

            <AsyncState state={messages} loadingText="Loading messages…">
              {() =>
                related.length === 0 ? (
                  <EmptyMessage text="No messages for this student or class yet." />
                ) : (
                  <div className="relative border-l border-slate-200 ml-4 space-y-8 pb-4">
                    {related.map((m) => {
                      const isClass = m.recipientType === 'CLASS';
                      const Icon = isClass ? Users : MessageSquare;
                      return (
                        <div key={m.id} className="relative pl-6">
                          <div
                            className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                              isClass ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`}
                          ></div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="text-sm font-semibold text-slate-900 truncate">{m.subject}</span>
                              </div>
                              <span className="text-xs text-slate-500 shrink-0">{formatDateTime(m.sentAt)}</span>
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-line">{m.body}</p>
                            <div className="mt-2 text-xs text-slate-500 font-medium">
                              From {m.senderName} ({String(m.senderRole || '').toLowerCase()}) to{' '}
                              {isClass ? `Class ${m.className}` : m.recipientName}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </AsyncState>
          </div>
        </div>
      </div>
    </div>
  );
};
