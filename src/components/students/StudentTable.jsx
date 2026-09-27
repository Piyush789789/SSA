import React from 'react';
import { StudentRow } from './StudentRow';

export const StudentTable = ({ students }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Student</th>
              <th className="py-3.5 px-4 sm:px-6">Class</th>
              <th className="py-3.5 px-4 sm:px-6">Roll No.</th>
              <th className="py-3.5 px-4 sm:px-6">Attendance</th>
              <th className="py-3.5 px-4 sm:px-6">Fee Status</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <StudentRow key={student.id} student={student} />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm font-medium">
                  No students found matching your search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
