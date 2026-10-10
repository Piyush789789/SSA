import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { AsyncState } from '@/components/common/AsyncState';
import { formatDateTime, initialsOf } from '@/utils';
import { useI18n } from '@/i18n/translate';

const CATEGORY = {
  CLASS: 'Class Broadcast',
  STUDENT: 'Personal',
  TEACHER: 'To Teacher',
};

export const StudentCommunicationPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const className = currentUser?.className;
  const myIds = [currentUser?.id, currentUser?.studentId, currentUser?.userId].filter(Boolean);

  const messages = useApi('/messages');
  const teachers = useApi('/teachers');
  const classInfo = useApi(className ? `/classes/${encodeURIComponent(className)}` : null);

  const [activeTab, setActiveTab] = useState('INBOX'); // 'INBOX' | 'SENT' | 'COMPOSE'
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const classTeacherId = classInfo.data?.classTeacherId;
  const classTeachers = useMemo(
    () =>
      (teachers.data || [])
        .filter((t) => (t.assignedClasses || []).includes(className))
        .sort((a, b) => (a.id === classTeacherId ? -1 : b.id === classTeacherId ? 1 : a.name.localeCompare(b.name))),
    [teachers.data, className, classTeacherId],
  );
  const selectedTeacherId = targetTeacherId || classTeachers[0]?.id || '';

  const isMine = (m) => myIds.includes(m.senderId);
  const allMessages = messages.data || [];
  const inbox = allMessages.filter((m) => !isMine(m));
  const sent = allMessages.filter(isMine);

  const searchText = searchQuery.toLowerCase().trim();
  const visibleMessages = (activeTab === 'SENT' ? sent : inbox).filter(
    (m) => !searchText || [m.subject, m.body, m.senderName, m.recipientName].some((v) => v && v.toLowerCase().includes(searchText)),
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      setSendError('Choose a teacher.');
      return;
    }
    if (!subject.trim() || !messageBody.trim()) {
      setSendError('Please enter a subject and your question.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await http.post('/messages', {
        recipientType: 'TEACHER',
        recipientId: selectedTeacherId,
        subject: subject.trim(),
        body: messageBody.trim(),
      });
      const teacherName = classTeachers.find((t) => t.id === selectedTeacherId)?.name || 'your teacher';
      setSubject('');
      setMessageBody('');
      setActiveTab('SENT');
      messages.reload();
      triggerToast(`Your message has been sent to ${teacherName}!`);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
      activeTab === tab ? 'bg-[#FF6B2C] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
    }`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#FF6B2C]" />
            {tx('Student Communication')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Connect with your teachers and view classroom messages{className ? ` for Class ${className}` : ''}.
          </p>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'COMPOSE' ? 'INBOX' : 'COMPOSE')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-sm shadow-[#FF6B2C]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          {activeTab === 'COMPOSE' ? 'View Received Messages' : 'Ask a Question to Teacher'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <button onClick={() => setActiveTab('INBOX')} className={tabClass('INBOX')}>
          Inbox {messages.data ? `(${inbox.length})` : ''}
        </button>
        <button onClick={() => setActiveTab('SENT')} className={tabClass('SENT')}>
          Sent {messages.data ? `(${sent.length})` : ''}
        </button>
        <button onClick={() => setActiveTab('COMPOSE')} className={tabClass('COMPOSE')}>
          Ask Teacher
        </button>
      </div>

      {activeTab === 'COMPOSE' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Send Question or Query to Teacher</h2>
              <p className="text-xs text-slate-500">Your teacher will respond during school working hours.</p>
            </div>
          </div>

          <AsyncState state={teachers} loadingText="Loading teachers…">
            {() => (
              <form onSubmit={handleSend} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Teacher</label>
                  {classTeachers.length === 0 ? (
                    <p className="text-xs text-slate-500">No teachers are assigned to your class yet.</p>
                  ) : (
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setTargetTeacherId(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 px-3.5 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20"
                    >
                      {classTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.id === classTeacherId ? ' (Class Teacher)' : ''}
                          {t.subjects?.length ? ` – ${t.subjects.join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject / Topic</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Question about Chapter 4 homework problem #5"
                    className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-4 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Question / Message</label>
                  <textarea
                    rows={5}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your question in detail here..."
                    className="w-full bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 p-4 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 resize-none"
                    required
                  />
                </div>

                {sendError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {sendError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('INBOX')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    {tx('Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={sending || classTeachers.length === 0}
                    className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold rounded-2xl text-xs sm:text-sm shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </AsyncState>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages by sender, subject, or keyword..."
              className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-none"
            />
          </div>

          <AsyncState state={messages} loadingText="Loading messages…">
            {() => (
              <div className="grid grid-cols-1 gap-4">
                {visibleMessages.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-700">No messages found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'There are no messages matching your search.' : activeTab === 'SENT' ? 'You have not sent any messages yet.' : 'Your inbox is empty.'}
                    </p>
                  </div>
                ) : (
                  visibleMessages.map((msg) => {
                    const mine = isMine(msg);
                    return (
                      <div
                        key={msg.id}
                        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-[#FF6B2C]/40 p-5 sm:p-6 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF6B2C] flex items-center justify-center font-bold text-sm shrink-0">
                              {initialsOf(mine ? msg.recipientName || '' : msg.senderName || '')}
                            </div>
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900">{msg.subject}</h3>
                              <p className="text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span>
                                  {mine ? 'To: ' : 'From: '}
                                  <strong className="text-slate-700">
                                    {mine ? msg.recipientName : msg.senderName}
                                    {!mine && msg.senderRole ? ` (${String(msg.senderRole).toLowerCase()})` : ''}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span className="text-[#EA580C] bg-[#FFF5F0] px-2 py-0.5 rounded-md font-medium text-[11px]">
                                  {CATEGORY[msg.recipientType] || msg.recipientType}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDateTime(msg.sentAt)}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-0 sm:pl-[52px] whitespace-pre-line">
                          {msg.body}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </AsyncState>
        </div>
      )}
    </div>
  );
};

export default StudentCommunicationPage;
