import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDateTime, initialsOf } from '@/utils';

const CATEGORY_LABELS = {
  CLASS: 'Class Announcement',
  STUDENT: 'About Your Child',
  TEACHER: 'Sent to Teacher',
};

export const ParentCommunicationPage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();
  const linkedChildren = currentUser?.linkedChildren || [];
  const childId = selectedChild?.studentId ?? null;
  const className = selectedChild?.className ?? null;

  const messages = useApi('/messages');
  const teachers = useApi('/teachers');
  const classInfo = useApi(className ? `/classes/${encodeURIComponent(className)}` : null);

  const [activeTab, setActiveTab] = useState('INBOX'); // 'INBOX' | 'COMPOSE'
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  // The chosen teacher belongs to the child it was chosen for, so switching child resets it.
  const [teacherChoice, setTeacherChoice] = useState({ childId: null, teacherId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const myId = currentUser?.id;
  const myParentId = currentUser?.parentId;
  const isMine = (m) => m.senderId === myId || m.senderId === myParentId;

  const classTeachers = useMemo(
    () =>
      (teachers.data || [])
        .filter((t) => (t.assignedClasses || []).includes(className))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teachers.data, className],
  );
  const classTeacherId = classInfo.data?.classTeacherId;
  const targetTeacherId = teacherChoice.childId === childId ? teacherChoice.teacherId : '';
  const targetTeacher = classTeachers.find((t) => t.id === targetTeacherId) || null;

  const childMessages = useMemo(() => {
    const relevant = (messages.data || []).filter((m) => {
      if (m.recipientType === 'CLASS') return m.className === className;
      if (m.recipientType === 'STUDENT') return m.recipientId === childId;
      // Messages the parent sent to a teacher: show those about this child's class (or not tied to one class).
      const mine = m.senderId === myId || m.senderId === myParentId;
      return mine && (!m.className || m.className === className);
    });
    if (!searchQuery.trim()) return relevant;
    const q = searchQuery.toLowerCase().trim();
    return relevant.filter(
      (m) =>
        m.subject?.toLowerCase().includes(q) ||
        m.senderName?.toLowerCase().includes(q) ||
        m.recipientName?.toLowerCase().includes(q) ||
        m.body?.toLowerCase().includes(q),
    );
  }, [messages.data, className, childId, searchQuery, myId, myParentId]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!targetTeacher) return setSendError('Please choose a teacher.');
    if (!subject.trim() || !messageBody.trim()) return setSendError('Please enter a subject and message.');

    setSending(true);
    setSendError('');
    try {
      await http.post('/messages', {
        recipientType: 'TEACHER',
        recipientId: targetTeacher.id,
        subject: `[${selectedChild.name}, ${className}] ${subject.trim()}`,
        body: messageBody.trim(),
      });
      setSubject('');
      setMessageBody('');
      setActiveTab('INBOX');
      triggerToast(`Your message has been sent to ${targetTeacher.name}.`);
      messages.reload();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!selectedChild) {
    return <EmptyMessage text="No child is linked to this parent account yet." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#FF6B2C]" />
            Parent–Teacher Communication
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Connect directly with the teachers of {selectedChild.name} (Class {className}).
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
          <select
            value={selectedChild.studentId}
            onChange={(e) => switchChild(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-3"
          >
            {linkedChildren.map((child) => (
              <option key={child.studentId} value={child.studentId}>
                {child.name} ({child.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab('INBOX')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'INBOX'
              ? 'bg-[#FF6B2C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Messages{messages.data ? ` (${childMessages.length})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('COMPOSE')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'COMPOSE'
              ? 'bg-[#FF6B2C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Send Query to Teacher
        </button>
      </div>

      {activeTab === 'COMPOSE' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Message a teacher regarding {selectedChild.name}
              </h2>
              <p className="text-xs text-slate-500">Only teachers of Class {className} are listed.</p>
            </div>
          </div>

          <AsyncState state={teachers} loadingText="Loading teachers…">
            {() =>
              classTeachers.length === 0 ? (
                <EmptyMessage text={`No teachers are assigned to Class ${className} yet.`} />
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Teacher</label>
                    <select
                      value={targetTeacherId}
                      onChange={(e) => setTeacherChoice({ childId, teacherId: e.target.value })}
                      className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                      required
                    >
                      <option value="">Choose a teacher…</option>
                      {classTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.id === classTeacherId ? ' (Class Teacher)' : ''}
                          {t.subjects?.length ? ` — ${t.subjects.join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject / Query Topic</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Leave application / Question about exam revision"
                      className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-4 focus:outline-none focus:border-[#FF6B2C]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Message</label>
                    <textarea
                      rows={5}
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your question or request here..."
                      className="w-full bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 p-4 focus:outline-none focus:border-[#FF6B2C] resize-none"
                      required
                    />
                  </div>

                  {sendError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
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
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] disabled:opacity-60 text-white font-semibold rounded-2xl text-xs sm:text-sm shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending…' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )
            }
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
              placeholder="Search messages by sender, subject, or content..."
              className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-none"
            />
          </div>

          <AsyncState state={messages} loadingText="Loading messages…">
            {() =>
              childMessages.length === 0 ? (
                <EmptyMessage
                  text={searchQuery.trim() ? 'No messages match your search.' : `No messages for ${selectedChild.name} yet.`}
                />
              ) : (
                <div className="space-y-4">
                  {childMessages.map((msg) => {
                    const mine = isMine(msg);
                    return (
                      <div
                        key={msg.id}
                        className={`bg-white rounded-3xl border shadow-xs hover:border-[#FF6B2C]/40 p-5 sm:p-6 transition-all space-y-3 ${
                          mine ? 'border-orange-200/80' : 'border-slate-200/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF6B2C] flex items-center justify-center font-bold text-sm shrink-0">
                              {initialsOf(mine ? msg.recipientName : msg.senderName)}
                            </div>
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900">{msg.subject}</h3>
                              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                {mine ? (
                                  <>
                                    To: <strong className="text-slate-700">{msg.recipientName}</strong>
                                  </>
                                ) : (
                                  <>
                                    From: <strong className="text-slate-700">{msg.senderName}</strong>
                                  </>
                                )}{' '}
                                •{' '}
                                <span className="text-[#EA580C] bg-[#FFF5F0] px-2 py-0.5 rounded-md font-medium text-[11px]">
                                  {mine ? 'Sent by you' : CATEGORY_LABELS[msg.recipientType] || msg.recipientType}
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
                  })}
                </div>
              )
            }
          </AsyncState>
        </div>
      )}
    </div>
  );
};

export default ParentCommunicationPage;
