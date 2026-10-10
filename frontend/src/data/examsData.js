/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Master Exams, Marks, Grading, and Results Data Model
 */

export const EXAM_TYPES = [
  'Unit Test',
  'Periodic Test',
  'Mid-Term',
  'Half-Yearly',
  'Final',
  'Annual',
  'Pre-Board',
  'Custom',
];

export const EXAM_STATUS_STYLES = {
  Scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Upcoming: 'bg-orange-50 text-[#FF6B2C] border border-orange-200',
  Ongoing: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export const DEFAULT_GRADE_CONFIG = [
  { min: 90, max: 100, grade: 'A+', gpa: 10.0, label: 'Outstanding' },
  { min: 80, max: 89, grade: 'A', gpa: 9.0, label: 'Excellent' },
  { min: 70, max: 79, grade: 'B+', gpa: 8.0, label: 'Very Good' },
  { min: 60, max: 69, grade: 'B', gpa: 7.0, label: 'Good' },
  { min: 50, max: 59, grade: 'C', gpa: 6.0, label: 'Average' },
  { min: 40, max: 49, grade: 'D', gpa: 5.0, label: 'Pass' },
  { min: 0, max: 39, grade: 'F', gpa: 0.0, label: 'Fail' },
];

export const calculateGradeAndGPA = (percentage, config = DEFAULT_GRADE_CONFIG) => {
  const p = Math.round(percentage);
  const found = config.find((c) => p >= c.min && p <= c.max);
  if (found) {
    return { grade: found.grade, gpa: found.gpa, label: found.label };
  }
  if (p < 40) return { grade: 'F', gpa: 0.0, label: 'Fail' };
  return { grade: 'A+', gpa: 10.0, label: 'Outstanding' };
};

export const INITIAL_EXAMS = [
  {
    id: 'exam-501',
    name: 'Mid-Term Examination 2026',
    type: 'Mid-Term',
    academicYear: '2026-27',
    startDate: '2026-10-10',
    endDate: '2026-10-22',
    classes: ['5-B', '6-A', '10-A', '10-B', '9-A', '9-B', '8-A', '8-B'],
    status: 'Upcoming',
    description: 'Comprehensive mid-term evaluation across core subjects.',
    marksCompletion: 0,
    resultsStatus: 'Pending',
  },
  {
    id: 'exam-502',
    name: 'Unit Test 1 — Primary & Middle',
    type: 'Unit Test',
    academicYear: '2026-27',
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    classes: ['5-B', '6-A', '1-A', '1-B', '2-A', '2-B', '7-A', '7-B'],
    status: 'Completed',
    description: 'First periodic assessment for primary and upper primary classes.',
    marksCompletion: 100,
    resultsStatus: 'Published',
  },
  {
    id: 'exam-503',
    name: 'Class Assessment Test 2',
    type: 'Periodic Test',
    academicYear: '2026-27',
    startDate: '2026-09-28',
    endDate: '2026-10-05',
    classes: ['5-B', '6-A'],
    status: 'Active',
    description: 'Monthly evaluation test for Mathematics and Science.',
    marksCompletion: 65,
    resultsStatus: 'Draft',
  },
  {
    id: 'exam-001',
    name: 'Mid-Term Examination',
    type: 'Mid-Term',
    academicYear: '2026-27',
    startDate: '2026-10-10',
    endDate: '2026-10-22',
    classes: ['10-A', '10-B', '9-A', '9-B', '8-A', '8-B'],
    status: 'Scheduled',
    description: 'Comprehensive mid-term evaluation across core academic subjects.',
    marksCompletion: 86,
    resultsStatus: 'Published',
  },
];

export const INITIAL_EXAM_SCHEDULES = [
  // Class 5-B & 6-A Schedules (Anjali Singh's subjects: Mathematics & Science)
  { id: 'sch-501', examId: 'exam-503', subject: 'Mathematics', className: '5-B', date: '2026-09-29', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 50, passingMarks: 18, status: 'Active' },
  { id: 'sch-502', examId: 'exam-503', subject: 'Science', className: '6-A', date: '2026-09-30', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 50, passingMarks: 18, status: 'Active' },
  { id: 'sch-503', examId: 'exam-502', subject: 'Mathematics', className: '5-B', date: '2026-09-16', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 25, passingMarks: 9, status: 'Completed' },
  { id: 'sch-504', examId: 'exam-502', subject: 'Science', className: '6-A', date: '2026-09-18', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 25, passingMarks: 9, status: 'Completed' },
  { id: 'sch-505', examId: 'exam-501', subject: 'Mathematics', className: '5-B', date: '2026-10-12', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Upcoming' },
  { id: 'sch-506', examId: 'exam-501', subject: 'Science', className: '6-A', date: '2026-10-15', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Upcoming' },

  { id: 'sch-001', examId: 'exam-001', subject: 'Mathematics', className: '10-A', date: '2026-10-12', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Scheduled' },
];

export const INITIAL_SCHEDULES = INITIAL_EXAM_SCHEDULES;

export const INITIAL_MARKS_RECORDS = [
  // Class 5-B Class Assessment Test 2 Mathematics (exam-503)
  { id: 'm-501', examId: 'exam-503', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0501', studentName: 'Marium Chauhan', rollNumber: 1, maxMarks: 50, obtainedMarks: 46, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-502', examId: 'exam-503', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0502', studentName: 'Kabir Jain', rollNumber: 2, maxMarks: 50, obtainedMarks: 44, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-503', examId: 'exam-503', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0503', studentName: 'Rohit Verma', rollNumber: 3, maxMarks: 50, obtainedMarks: 38, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-504', examId: 'exam-503', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0504', studentName: 'Rohit Ahmad', rollNumber: 4, maxMarks: 50, obtainedMarks: 48, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-505', examId: 'exam-503', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0505', studentName: 'Sneha Sharma', rollNumber: 5, maxMarks: 50, obtainedMarks: 49, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-506', examId: 'exam-503', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0506', studentName: 'Saif Abbasi', rollNumber: 6, maxMarks: 50, obtainedMarks: 32, isAbsent: false, status: 'Draft', teacher: 'Anjali Singh' },

  // Class 6-A Class Assessment Test 2 Science (exam-503)
  { id: 'm-601', examId: 'exam-503', className: '6-A', subject: 'Science', studentId: 'STU-2026-0601', studentName: 'Owais Khan', rollNumber: 1, maxMarks: 50, obtainedMarks: 47, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-602', examId: 'exam-503', className: '6-A', subject: 'Science', studentId: 'STU-2026-0602', studentName: 'Sara Khan', rollNumber: 2, maxMarks: 50, obtainedMarks: 45, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-603', examId: 'exam-503', className: '6-A', subject: 'Science', studentId: 'STU-2026-0603', studentName: 'Aarav Mehta', rollNumber: 3, maxMarks: 50, obtainedMarks: 40, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-604', examId: 'exam-503', className: '6-A', subject: 'Science', studentId: 'STU-2026-0604', studentName: 'Ananya Gupta', rollNumber: 4, maxMarks: 50, obtainedMarks: 48, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-605', examId: 'exam-503', className: '6-A', subject: 'Science', studentId: 'STU-2026-0605', studentName: 'Rahul Singh', rollNumber: 5, maxMarks: 50, obtainedMarks: 42, isAbsent: false, status: 'Draft', teacher: 'Anjali Singh' },

  // Unit Test 1 (exam-502)
  { id: 'm-511', examId: 'exam-502', className: '5-B', subject: 'Mathematics', studentId: 'STU-2026-0501', studentName: 'Marium Chauhan', rollNumber: 1, maxMarks: 25, obtainedMarks: 24, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-611', examId: 'exam-502', className: '6-A', subject: 'Science', studentId: 'STU-2026-0601', studentName: 'Owais Khan', rollNumber: 1, maxMarks: 25, obtainedMarks: 23, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
];
