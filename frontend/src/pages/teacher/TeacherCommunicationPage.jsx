import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatDateTime } from '@/utils';
import { useI18n } from '@/i18n/translate';

const recipientLabel = (msg) => {
  if (msg.recipientType === 'CLASS') return `Class ${msg.className} families`;
  if (msg.recipientType === 'STUDENT') return `${msg.recipientName ?? msg.recipientId} (family)`;
  return msg.recipientName ?? msg.recipientId;
};

export const TeacherCommunicationPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const assignedClasses = useMemo(() => currentUser?.assignedClasses ?? [], [currentUser]);

  const [selectedClass, setSelectedClass] = useState(() => assignedClasses[0] ?? '');
  const [recipientType, setRecipientType] = useState('CLASS'); // 'CLASS' | 'STUDENT'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [logFilter, setLogFilter] = useState('ALL'); // ALL | RECEIVED | SENT

  const messages = useApi('/messages');
  const classStudents = useApi(
    recipientType === 'STUDENT' && selectedClass ? `/classes/${encodeURIComponent(selectedClass)}/students` : null,
  );

  const visibleMessages = useMemo(() => {
    return (messages.data ?? []).filter((msg) => {
      const mine = msg.senderId === currentUser?.id;
      if (logFilter === 'SENT') return mine;
      if (logFilter === 'RECEIVED') return !mine;
      return true;
    });
  }, [messages.data, logFilter, currentUser]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !messageBody.trim()) {
      setSendError('Please enter a subject and message body.');
      return;
    }
    if (recipientType === 'STUDENT' && !selectedStudentId) {
      setSendError('Please choose a student.');
      return;
    }

    const body =
      recipientType === 'CLASS'
        ? { recipientType: 'CLASS', className: selectedClass, subject: subject.trim(), body: messageBody.trim() }
        : { recipientType: 'STUDENT', recipientId: selectedStudentId, subject: subject.trim(), body: messageBody.trim() };

    setSending(true);
    setSendError('');
    try {
      const sent = await http.post('/messages', body);
      setSubject('');
      setMessageBody('');
      triggerToast(`Message sent to ${sent ? recipientLabel(sent) : 'the recipients'}.`);
      messages.reload();
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('Communication & Parent Messages')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Send class announcements and direct messages to students and their families
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Compose Form Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Compose Message</h2>
            <p className="text-xs text-slate-500">Send an update to a whole class or one student's family</p>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                >
                  {assignedClasses.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Scope</label>
                <select
                  value={recipientType}
                  onChange={(e) => {
                    setRecipientType(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                >
                  <option value="CLASS">Entire Class (students & parents)</option>
                  <option value="STUDENT">Specific Student / Parent</option>
                </select>
              </div>
            </div>

            {recipientType === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Student</label>
                <AsyncState state={classStudents} loadingText="Loading students…">
                  {(list) => (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                    >
                      <option value="">{list.length ? 'Select a student...' : 'No students in this class'}</option>
                      {list.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Roll #{s.rollNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </AsyncState>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Header</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science Fair Project Submission Reminder"
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
              <textarea
                rows="5"
                required
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
              />
            </div>

            {sendError && <p className="text-xs font-semibold text-rose-600">{sendError}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending || !selectedClass}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 stroke-[2]" />
                <span>{sending ? 'Sending…' : 'Send Communication'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Message Log (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Messages</h2>
              <p className="text-xs text-slate-500">Messages you sent and replies from families</p>
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
              {[
                ['ALL', 'All'],
                ['RECEIVED', 'Inbox'],
                ['SENT', 'Sent'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLogFilter(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    logFilter === key ? 'bg-white text-[#FF6B2C] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AsyncState state={messages} loadingText="Loading messages…">
            {() => (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {visibleMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No messages yet.</p>
                ) : (
                  visibleMessages.map((msg) => {
                    const mine = msg.senderId === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 hover:border-orange-200 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF6B2C] font-bold rounded-md text-[10px]">
                            {mine ? `To: ${recipientLabel(msg)}` : `From: ${msg.senderName}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(msg.sentAt)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900">{msg.subject}</h4>
                        <p className="text-[11px] text-slate-600 whitespace-pre-line">{msg.body}</p>

                        <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-bold">
                          {mine ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Sent
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Inbox className="w-3 h-3" />
                              Received{msg.senderRole ? ` from a ${String(msg.senderRole).toLowerCase()}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </AsyncState>
        </div>
      </div>
    </div>
  );
};

export default TeacherCommunicationPage;
