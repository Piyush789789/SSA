import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Clock, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const ParentCommunicationPage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();
  const { messages, sendMessage } = useData();

  const linkedChildren = currentUser?.linkedChildren || [];
  const currentChild = selectedChild || linkedChildren[0] || {
    name: 'Yash Verma',
    className: '8-A',
    rollNumber: 24,
    studentId: 'STU-2026-0824',
    classTeacher: 'Javed Akhtar',
  };

  const [activeTab, setActiveTab] = useState('INBOX'); // 'INBOX' | 'COMPOSE'
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [targetTeacher, setTargetTeacher] = useState(currentChild.classTeacher || 'Javed Akhtar');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const childMessages = useMemo(() => {
    const defaultMessages = [
      {
        id: 'PMSG-01',
        sender: `${currentChild.classTeacher || 'Javed Akhtar'} (Class Teacher)`,
        recipient: `${currentUser?.name || 'Rajesh Verma'} (Parent of ${currentChild.name})`,
        subject: `Quarterly Progress Review for ${currentChild.name}`,
        message: `Dear Parent, ${currentChild.name} is showing solid performance in Mathematics and Science. Please ensure he continues regular practice for the upcoming Unit Test 2.`,
        sentAt: 'Yesterday at 4:15 PM',
        category: 'Academic Feedback',
      },
      {
        id: 'PMSG-02',
        sender: 'School Accounts Office',
        recipient: 'All Parents',
        subject: 'Receipt confirmation for Quarter 1 Tuition',
        message: 'Your payment for Quarter 1 has been verified and credited. You can download the official receipt anytime from the Fees tab.',
        sentAt: '3 days ago at 10:00 AM',
        category: 'Accounts',
      },
      {
        id: 'PMSG-03',
        sender: 'Neelam Gupta (English Teacher)',
        recipient: `Parents of Class ${currentChild.className}`,
        subject: 'Inter-School Debate Competition Nomination',
        message: `${currentChild.name} has been selected to represent our school in the Inter-School Hindi/English debate on 5th September.`,
        sentAt: '5 days ago at 2:30 PM',
        category: 'Co-Curricular',
      },
    ];

    if (!searchQuery.trim()) return defaultMessages;
    const q = searchQuery.toLowerCase().trim();
    return defaultMessages.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.sender.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
    );
  }, [currentChild, currentUser, searchQuery]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!subject.trim() || !messageBody.trim()) {
      alert('Please enter a subject and message.');
      return;
    }

    const now = new Date();
    const formattedTime =
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' at ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `PQUERY-${Date.now()}`,
      recipientType: 'Teacher',
      className: currentChild.className,
      recipientName: targetTeacher,
      subject: `[Parent Query - ${currentChild.name}] ${subject}`,
      message: messageBody,
      sentAt: formattedTime,
      status: 'Sent',
      author: `${currentUser?.name || 'Rajesh Verma'} (Parent)`,
    };

    sendMessage(newMsg);
    setSubject('');
    setMessageBody('');
    setActiveTab('INBOX');
    triggerToast(`Your message has been delivered to ${targetTeacher}!`);
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

      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#FF6B2C]" />
            Parent–Teacher Communication
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Connect directly with teachers and school administration for {currentChild.name}.
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
          <select
            value={currentChild.studentId}
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
          Teacher Messages ({childMessages.length})
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
                Message Class Teacher regarding {currentChild.name}
              </h2>
              <p className="text-xs text-slate-500">Teachers typically respond within 24 school working hours.</p>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Instructor</label>
              <select
                value={targetTeacher}
                onChange={(e) => setTargetTeacher(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
              >
                <option value="Javed Akhtar (Class Teacher & Science)">Javed Akhtar (Class Teacher & Science)</option>
                <option value="Shahid Ali (Mathematics)">Shahid Ali (Mathematics)</option>
                <option value="Neelam Gupta (English)">Neelam Gupta (English)</option>
                <option value="Farhat Jahan (Hindi)">Farhat Jahan (Hindi)</option>
                <option value="School Principal / Administration">Principal / Admin Office</option>
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

          <div className="space-y-4">
            {childMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-[#FF6B2C]/40 p-5 sm:p-6 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF6B2C] flex items-center justify-center font-bold text-sm shrink-0">
                      {msg.sender.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{msg.subject}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        From: <strong className="text-slate-700">{msg.sender}</strong> •{' '}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentCommunicationPage;
