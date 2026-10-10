import React from 'react';
import { FileText } from 'lucide-react';

/** The backend has no document storage yet, so this tab only explains that. */
export const ProfileDocuments = ({ student }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Documents — not available yet</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-md">
        Uploading and storing documents for {student.name} (Aadhaar, birth certificate, TC, etc.) is not supported by
        the server yet.
      </p>
    </div>
  );
};
