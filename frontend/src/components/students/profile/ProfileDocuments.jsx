import React from 'react';
import { FileText, Download, Eye, UploadCloud, File, Image as ImageIcon } from 'lucide-react';

export const ProfileDocuments = ({ student }) => {
  const documents = [
    { id: 1, name: 'Aadhar Card', type: 'PDF', size: '2.4 MB', date: '15 Mar 2026', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 2, name: 'Birth Certificate', type: 'JPG', size: '1.1 MB', date: '15 Mar 2026', icon: ImageIcon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 3, name: 'Previous School TC', type: 'PDF', size: '3.8 MB', date: '20 Mar 2026', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 4, name: 'Medical Certificate', type: 'PDF', size: '1.5 MB', date: '05 Apr 2026', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Upload Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 border-dashed border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Upload New Document</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md">Drag and drop files here, or click to browse your computer. Supported formats: PDF, JPG, PNG (Max 5MB)</p>
        <button className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm">
          Select File
        </button>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Uploaded Documents</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="group relative rounded-xl border border-slate-100 p-4 hover:border-indigo-100 hover:shadow-md transition-all bg-white">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.bg} ${doc.color}`}>
                  <doc.icon className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 text-sm truncate" title={doc.name}>{doc.name}</h4>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span>{doc.type} • {doc.size}</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};
