/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Centralized Attendance Data Model & Mock Data Generator
 */

export const CLASSES_LIST = [
  { id: 'CLASS-1-A', name: '1-A', grade: 1, section: 'A', totalStudents: 42 },
  { id: 'CLASS-1-B', name: '1-B', grade: 1, section: 'B', totalStudents: 40 },
  { id: 'CLASS-2-A', name: '2-A', grade: 2, section: 'A', totalStudents: 45 },
  { id: 'CLASS-2-B', name: '2-B', grade: 2, section: 'B', totalStudents: 43 },
  { id: 'CLASS-3-A', name: '3-A', grade: 3, section: 'A', totalStudents: 41 },
  { id: 'CLASS-3-B', name: '3-B', grade: 3, section: 'B', totalStudents: 39 },
  { id: 'CLASS-4-A', name: '4-A', grade: 4, section: 'A', totalStudents: 44 },
  { id: 'CLASS-4-B', name: '4-B', grade: 4, section: 'B', totalStudents: 40 },
  { id: 'CLASS-5-A', name: '5-A', grade: 5, section: 'A', totalStudents: 42 },
  { id: 'CLASS-5-B', name: '5-B', grade: 5, section: 'B', totalStudents: 38 },
  { id: 'CLASS-6-A', name: '6-A', grade: 6, section: 'A', totalStudents: 45 },
  { id: 'CLASS-6-B', name: '6-B', grade: 6, section: 'B', totalStudents: 41 },
  { id: 'CLASS-7-A', name: '7-A', grade: 7, section: 'A', totalStudents: 40 },
  { id: 'CLASS-7-B', name: '7-B', grade: 7, section: 'B', totalStudents: 38 },
  { id: 'CLASS-8-A', name: '8-A', grade: 8, section: 'A', totalStudents: 43 },
  { id: 'CLASS-8-B', name: '8-B', grade: 8, section: 'B', totalStudents: 39 },
  { id: 'CLASS-9-A', name: '9-A', grade: 9, section: 'A', totalStudents: 44 },
  { id: 'CLASS-9-B', name: '9-B', grade: 9, section: 'B', totalStudents: 42 },
  { id: 'CLASS-10-A', name: '10-A', grade: 10, section: 'A', totalStudents: 46 },
  { id: 'CLASS-10-B', name: '10-B', grade: 10, section: 'B', totalStudents: 40 },
];

export const ATTENDANCE_STUDENTS = [
  { id: 'STU-2026-0001', name: 'Ayesha Abbasi', classId: 'CLASS-1-A', className: '1-A', rollNumber: 1, email: 'ayesha.a@ssa.edu.in' },
  { id: 'STU-2026-0002', name: 'Anas Kashyap', classId: 'CLASS-1-A', className: '1-A', rollNumber: 2, email: 'anas.k@ssa.edu.in' },
  { id: 'STU-2026-0003', name: 'Kabir Jain', classId: 'CLASS-1-A', className: '1-A', rollNumber: 3, email: 'kabir.j@ssa.edu.in' },
  { id: 'STU-2026-0004', name: 'Kavya Sharma', classId: 'CLASS-1-A', className: '1-A', rollNumber: 4, email: 'kavya.s@ssa.edu.in' },
  { id: 'STU-2026-0005', name: 'Aditi Sharma', classId: 'CLASS-1-B', className: '1-B', rollNumber: 1, email: 'aditi.s@ssa.edu.in' },
  { id: 'STU-2026-0006', name: 'Iqra Saifi', classId: 'CLASS-1-B', className: '1-B', rollNumber: 2, email: 'iqra.s@ssa.edu.in' },
  { id: 'STU-2026-0007', name: 'Sanya Farooqui', classId: 'CLASS-1-B', className: '1-B', rollNumber: 3, email: 'sanya.f@ssa.edu.in' },
  { id: 'STU-2026-0008', name: 'Rohan Malhotra', classId: 'CLASS-2-A', className: '2-A', rollNumber: 1, email: 'rohan.m@ssa.edu.in' },
  { id: 'STU-2026-0009', name: 'Simran Kaur', classId: 'CLASS-2-A', className: '2-A', rollNumber: 2, email: 'simran.k@ssa.edu.in' },
  { id: 'STU-2026-0010', name: 'Vihaan Verma', classId: 'CLASS-2-B', className: '2-B', rollNumber: 1, email: 'vihaan.v@ssa.edu.in' },
  { id: 'STU-2026-0011', name: 'Priya Joshi', classId: 'CLASS-2-B', className: '2-B', rollNumber: 2, email: 'priya.j@ssa.edu.in' },
  { id: 'STU-2026-0012', name: 'Rahul Kumar', classId: 'CLASS-7-A', className: '7-A', rollNumber: 12, email: 'rahul.k@ssa.edu.in' },
  { id: 'STU-2026-0013', name: 'Tanya Roy', classId: 'CLASS-7-B', className: '7-B', rollNumber: 8, email: 'tanya.r@ssa.edu.in' },
  { id: 'STU-2026-0014', name: 'Mohit Singh', classId: 'CLASS-8-A', className: '8-A', rollNumber: 15, email: 'mohit.s@ssa.edu.in' },
  { id: 'STU-2026-0015', name: 'Zoya Khan', classId: 'CLASS-8-B', className: '8-B', rollNumber: 5, email: 'zoya.k@ssa.edu.in' },
];

// Seeded weekly dates for September 2026
const WEEK_DATES = [
  '2026-09-21', // Mon
  '2026-09-22', // Tue
  '2026-09-23', // Wed
  '2026-09-24', // Thu
  '2026-09-25', // Fri
  '2026-09-26', // Sat
  '2026-09-27', // Sun (Holiday)
  '2026-09-28', // Mon (Today)
];

// Helper to deterministic generate records
const generateAttendanceRecords = () => {
  const records = [];
  let idCounter = 1;

  WEEK_DATES.forEach((date) => {
    const isSunday = date === '2026-09-27';

    ATTENDANCE_STUDENTS.forEach((student, idx) => {
      let status = 'present';
      let checkIn = '08:00 AM';
      let remarks = '';

      if (isSunday) {
        status = 'holiday';
        checkIn = '—';
        remarks = 'Sunday Holiday';
      } else {
        // Create deterministic realistic variations for students
        if (student.id === 'STU-2026-0002' && date === '2026-09-28') {
          status = 'late';
          checkIn = '08:27 AM';
          remarks = 'Bus delay';
        } else if (student.id === 'STU-2026-0002' && date === '2026-09-21') {
          status = 'absent';
          checkIn = '—';
        } else if (student.id === 'STU-2026-0005' && date === '2026-09-26') {
          status = 'absent';
          checkIn = '—';
          remarks = 'Medical Leave';
        } else if (student.id === 'STU-2026-0006' && date === '2026-09-28') {
          status = 'absent';
          checkIn = '—';
          remarks = 'Fever';
        } else if (student.id === 'STU-2026-0006' && date === '2026-09-23') {
          status = 'late';
          checkIn = '08:20 AM';
        } else if (student.id === 'STU-2026-0012' && (date === '2026-09-28' || date === '2026-09-26' || date === '2026-09-24' || date === '2026-09-23')) {
          status = 'absent';
          checkIn = '—';
        } else if (student.id === 'STU-2026-0013' && (date === '2026-09-28' || date === '2026-09-25')) {
          status = 'leave';
          checkIn = '—';
          remarks = 'Approved Leave';
        } else if (student.id === 'STU-2026-0014' && date === '2026-09-28') {
          status = 'absent';
          checkIn = '—';
        } else if ((idx + idCounter) % 9 === 0) {
          status = 'late';
          checkIn = '08:18 AM';
        } else if ((idx + idCounter) % 13 === 0) {
          status = 'absent';
          checkIn = '—';
        }
      }

      records.push({
        id: `ATT-2026-${String(idCounter++).padStart(6, '0')}`,
        studentId: student.id,
        classId: student.classId,
        date,
        status,
        checkInTime: checkIn,
        remarks,
      });
    });
  });

  return records;
};

export const INITIAL_ATTENDANCE_RECORDS = generateAttendanceRecords();
