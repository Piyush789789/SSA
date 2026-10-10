import React from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { SchoolLetterhead } from '@/components/common/SchoolLetterhead';
import { PrintPageShell } from './PrintPageShell';

/** /exam-seating/:examId — room-wise seating list for an exam (one room per printed page). Admin and teachers. */
export const SeatingPrintPage = () => {
  const { examId } = useParams();
  const plan = useApi(`/exams/${encodeURIComponent(examId)}/seating`);
  const settings = useApi('/settings');

  return (
    <PrintPageShell title={plan.data?.examName ? `Seating plan — ${plan.data.examName}` : 'Seating plan'}>
      <AsyncState state={plan} loadingText="Loading seating plan…">
        {(data) =>
          !data?.rooms?.length ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <EmptyMessage text="No seating plan has been arranged for this exam." />
            </div>
          ) : (
            <div className="print-sheet space-y-6">
              {data.rooms.map((room) => (
                <div key={room.room} className="seating-room bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-4">
                  <SchoolLetterhead school={settings.data} title={`Seating plan — ${room.room}`} subtitle={data.examName} />
                  <p className="text-xs font-bold text-slate-600">
                    {room.seats.length} of {room.capacity} seats used
                  </p>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-2 py-1.5 text-left w-16">Seat</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-left">Student</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-left">Class</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-left">Roll no.</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-left">Admission no.</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-left w-32">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.seats.map((seat) => (
                        <tr key={seat.seatNumber}>
                          <td className="border border-slate-300 px-2 py-1.5 font-bold">{seat.seatNumber}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">{seat.studentName}</td>
                          <td className="border border-slate-300 px-2 py-1.5">{seat.className}</td>
                          <td className="border border-slate-300 px-2 py-1.5">{seat.rollNumber ?? '—'}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-mono">{seat.studentId}</td>
                          <td className="border border-slate-300 px-2 py-1.5" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end pt-8 text-xs font-bold text-slate-700">
                    <span className="border-t border-slate-500 pt-1 px-6">Invigilator</span>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </AsyncState>
    </PrintPageShell>
  );
};

export default SeatingPrintPage;
