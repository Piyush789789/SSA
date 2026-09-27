import React from 'react';
import { Send, MessageSquare, PhoneCall, Mail } from 'lucide-react';

export const ProfileCommunication = ({ student }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-left transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Send SMS</p>
                  <p className="text-xs text-slate-500">Quick notification</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-left transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Send Email</p>
                  <p className="text-xs text-slate-500">Detailed report or notice</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-left transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Log Call</p>
                  <p className="text-xs text-slate-500">Record a phone conversation</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col - Communication History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Communication History</h3>
            
            <div className="relative border-l border-slate-200 ml-4 space-y-8 pb-4">
              
              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">Fee Reminder Email</span>
                    </div>
                    <span className="text-xs text-slate-500">Yesterday, 10:30 AM</span>
                  </div>
                  <p className="text-sm text-slate-600">Automated reminder sent for upcoming Q2 tuition fee to {student.parent.email}</p>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">Phone Call with Father</span>
                    </div>
                    <span className="text-xs text-slate-500">12 Aug 2026, 04:15 PM</span>
                  </div>
                  <p className="text-sm text-slate-600">Discussed recent mid-term performance. Father mentioned they will arrange extra tuition for Hindi.</p>
                  <div className="mt-2 text-xs text-slate-500 font-medium">Logged by: Sana Parveen (Class Teacher)</div>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">Absent Notification SMS</span>
                    </div>
                    <span className="text-xs text-slate-500">01 Aug 2026, 09:05 AM</span>
                  </div>
                  <p className="text-sm text-slate-600">SMS sent to {student.parent.phone}: "Dear Parent, {student.name} is marked absent today without prior leave application."</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
