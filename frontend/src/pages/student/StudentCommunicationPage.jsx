import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Users, Mail, Clock, Sparkles, BookOpen, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const StudentCommunicationPage = () => {
  const { currentUser } = useAuth();
  const { messages, sendMessage } = useData();

  const studentName = currentUser?.name || 'Rohit Verma';
  const studentId = currentUser?.studentId || 'STU-2026-0503';
  const className = currentUser?.className || '5-B';
  const classTeacher = currentUser?.classTeacher || 'Anjali Singh';

  const [activeTab, setActiveTab] = useState('INBOX'); // 'INBOX' | 'COMPOSE' | 'ANNOUNCEMENTS'
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [targetTeacher, setTargetTeacher] = useState(classTeacher);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter messages relevant to this student or class
  const studentMessages = useMemo(() => {
    const defaultTeacherMessages = [
      {
        id: 'MSG-001',
        sender: `${classTeacher} (Class Teacher)`,
        recipient: `${studentName} (Class ${className})`,
        subject: 'Great performance in Mathematics Mid-Term!',
        message: 'Dear Rohit, congratulations on scoring 92/100 in the Mathematics Mid-Term examination. Keep up the consistent effort and practice on fraction word problems.',
        sentAt: 'Yesterday at 3:30 PM',
        category: 'Feedback',
        unread: false,
      },
      {
        id: 'MSG-002',
        sender: 'Vikram Mehta (Science Teacher)',
        recipient: `Class ${className} Students`,
        subject: 'Science Project Submission Reminder',
        message: 'Please remember that your Solar System working models or charts must be submitted by this Friday during Period 4.',
        sentAt: '2 days ago at 11:15 AM',
        category: 'Class Notice',
        unread: false,
      },
      {
        id: 'MSG-003',
        sender: 'School Administration',
        recipient: 'All Students & Parents',
        subject: 'Annual Sports Meet 2026 Registration Open',
        message: 'Students interested in participating in sprint (100m/200m), relay, long jump, or shot put can submit their names to their respective sports teachers.',
        sentAt: '3 days ago at 9:00 AM',
        category: 'School Broadcast',
        unread: true,
      },
    ];

    const erpMessages = messages
      .filter((m) => m.className === className || m.recipientType === 'All' || m.recipientName?.includes(studentName))
      .map((m) => ({
        id: m.id,
        sender: m.author || 'School Staff',
        recipient: m.recipientName || `Class ${className}`,
        subject: m.subject,
        message: m.message,
        sentAt: m.sentAt || 'Recently',
        category: m.recipientType === 'Student' ? 'Personal' : 'Class Broadcast',
        unread: false,
      }));

    const combined = [...erpMessages, ...defaultTeacherMessages];
    if (!searchQuery.trim()) return combined;

    const q = searchQuery.toLowerCase().trim();
    return combined.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.sender.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
    );
  }, [messages, className, studentName, classTeacher, searchQuery]);

  const handleSendQuery = (e) => {
    e.preventDefault();
    if (!subject.trim() || !messageBody.trim()) {
      alert('Please enter a subject and your question.');
      return;
    }

    const now = new Date();
    const formattedTime =
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' at ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `QUERY-${Date.now()}`,
      recipientType: 'Teacher',
      className: className,
      recipientName: targetTeacher,
      subject: `[Student Query] ${subject}`,
      message: messageBody,
      sentAt: formattedTime,
      status: 'Sent',
      author: `${studentName} (${studentId})`,
    };

    sendMessage(newMsg);
    setSubject('');
    setMessageBody('');
    setActiveTab('INBOX');
    triggerToast(`Your message has been sent to ${targetTeacher}!`);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#FF6B2C]" />
            Student Communication
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Connect with your teachers and view important classroom updates for Class {className}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'COMPOSE' ? 'INBOX' : 'COMPOSE')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-sm shadow-[#FF6B2C]/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {activeTab === 'COMPOSE' ? 'View Received Messages' : 'Ask a Question to Teacher'}
          </button>
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
          Inbox & Updates ({studentMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPOSE')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'COMPOSE'
              ? 'bg-[#FF6B2C] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Ask Teacher
        </button>
      </div>

      {activeTab === 'COMPOSE' ? (
        /* Compose Message / Question Card */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Send Question or Query to Teacher</h2>
              <p className="text-xs text-slate-500">Your class teacher will respond directly during school working hours.</p>
            </div>
          </div>

          <form onSubmit={handleSendQuery} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Teacher</label>
              <select
                value={targetTeacher}
                onChange={(e) => setTargetTeacher(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 px-3.5 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20"
              >
                <option value="Anjali Singh (Mathematics)">Anjali Singh (Class Teacher & Mathematics)</option>
                <option value="Vikram Mehta (Science)">Vikram Mehta (Science)</option>
                <option value="Priya Sharma (English)">Priya Sharma (English)</option>
                <option value="Rajesh Kumar (Social Science)">Rajesh Kumar (Social Studies)</option>
                <option value="School Admin / Principal">School Principal Office</option>
              </select>
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
                className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold rounded-2xl text-xs sm:text-sm shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Messages List View */
        <div className="space-y-4">
          {/* Search bar */}
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

          <div className="grid grid-cols-1 gap-4">
            {studentMessages.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700">No messages found</p>
                <p className="text-xs text-slate-400 mt-1">There are no messages matching your search.</p>
              </div>
            ) : (
              studentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-[#FF6B2C]/40 p-5 sm:p-6 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF6B2C] flex items-center justify-center font-bold text-sm shrink-0">
                        {msg.sender.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{msg.subject}</h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>From: <strong className="text-slate-700">{msg.sender}</strong></span>
                          <span>•</span>
                          <span className="text-[#EA580C] bg-[#FFF5F0] px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {msg.category}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{msg.sentAt}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-0 sm:pl-[52px]">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCommunicationPage;
