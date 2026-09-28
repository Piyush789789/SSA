import React, { useState, useMemo } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Users, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const TeacherCommunicationPage = () => {
  const { currentUser } = useAuth();
  const { students, messages, sendMessage } = useData();

  const assignedClasses = currentUser?.assignedClasses || ['5-B', '6-A'];
  const teacherName = currentUser?.name || 'Anjali Singh';

  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '5-B');
  const [recipientType, setRecipientType] = useState('ALL'); // 'ALL' | 'STUDENT'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Class students dropdown
  const classStudents = useMemo(() => {
    return students.filter((s) => s.className === selectedClass);
  }, [students, selectedClass]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!subject || !messageBody) {
      alert('Please enter a subject and message body.');
      return;
    }

    let recipientName = `Class ${selectedClass} Parents`;
    if (recipientType === 'STUDENT' && selectedStudentId) {
      const studentObj = classStudents.find((s) => (s.studentId || s.id) === selectedStudentId);
      if (studentObj) {
        recipientName = `${studentObj.name} (Parent)`;
      }
    }

    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `MSG-${Date.now()}`,
      recipientType: recipientType === 'ALL' ? 'Class' : 'Student',
      className: selectedClass,
      recipientName,
      subject,
      message: messageBody,
      sentAt: formattedTime,
      status: 'Sent',
      author: teacherName,
    };

    sendMessage(newMsg);
    setSubject('');
    setMessageBody('');
    triggerToast(`Message sent successfully to ${recipientName}.`);
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>Communication & Parent Messages</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Send class announcements and direct messages to parents and students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Compose Form Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Compose Message</h2>
            <p className="text-xs text-slate-500">Send an update to parents or specific students</p>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Class Dropdown */}
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

              {/* Recipient Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Scope</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                >
                  <option value="ALL">Entire Class Parents</option>
                  <option value="STUDENT">Specific Student / Parent</option>
                </select>
              </div>
            </div>

            {/* Individual Student Selector if scope is STUDENT */}
            {recipientType === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                >
                  <option value="">Select a student...</option>
                  {classStudents.map((s) => (
                    <option key={s.studentId || s.id} value={s.studentId || s.id}>
                      {s.name} (Roll #{s.rollNumber || 1})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
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

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
              <textarea
                rows="5"
                required
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your message to parents..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm"
              >
                <Send className="w-4 h-4 stroke-[2]" />
                <span>Send Communication</span>
              </button>
            </div>
          </form>
        </div>

        {/* Message Log & Sent Messages (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Sent Messages Log</h2>
            <p className="text-xs text-slate-500">History of communications sent by you</p>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No messages sent yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 hover:border-orange-200 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF6B2C] font-bold rounded-md text-[10px]">
                      {msg.recipientName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {msg.sentAt}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{msg.subject}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{msg.message}</p>

                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Sent to demo state
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCommunicationPage;
