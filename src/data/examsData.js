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
  {
    id: 'exam-002',
    name: 'Unit Test 1',
    type: 'Unit Test',
    academicYear: '2026-27',
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    classes: ['1-A', '1-B', '2-A', '2-B', '7-A', '7-B'],
    status: 'Completed',
    description: 'First periodic assessment for primary and upper primary classes.',
    marksCompletion: 100,
    resultsStatus: 'Published',
  },
  {
    id: 'exam-003',
    name: 'Half-Yearly Examination',
    type: 'Half-Yearly',
    academicYear: '2026-27',
    startDate: '2026-11-05',
    endDate: '2026-11-18',
    classes: ['1-A', '1-B', '2-A', '2-B', '7-A', '7-B', '8-A', '8-B', '10-A', '10-B'],
    status: 'Upcoming',
    description: 'School-wide half yearly evaluation for all grades.',
    marksCompletion: 0,
    resultsStatus: 'Pending',
  },
  {
    id: 'exam-004',
    name: 'Pre-Board Examination',
    type: 'Pre-Board',
    academicYear: '2026-27',
    startDate: '2026-12-10',
    endDate: '2026-12-20',
    classes: ['10-A', '10-B'],
    status: 'Upcoming',
    description: 'Mock board examination for Class 10 students.',
    marksCompletion: 0,
    resultsStatus: 'Pending',
  },
];

export const INITIAL_EXAM_SCHEDULES = [
  { id: 'sch-001', examId: 'exam-001', subject: 'Mathematics', className: '10-A', date: '2026-10-12', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Scheduled' },
  { id: 'sch-002', examId: 'exam-001', subject: 'English', className: '10-A', date: '2026-10-14', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Scheduled' },
  { id: 'sch-003', examId: 'exam-001', subject: 'Science', className: '10-A', date: '2026-10-16', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Scheduled' },
  { id: 'sch-004', examId: 'exam-001', subject: 'Hindi', className: '10-A', date: '2026-10-18', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Scheduled' },
  { id: 'sch-005', examId: 'exam-001', subject: 'Computer Science', className: '10-A', date: '2026-10-20', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, passingMarks: 33, status: 'Scheduled' },
  
  { id: 'sch-006', examId: 'exam-002', subject: 'EVS', className: '1-A', date: '2026-09-15', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 25, passingMarks: 9, status: 'Completed' },
  { id: 'sch-007', examId: 'exam-002', subject: 'Mathematics', className: '1-A', date: '2026-09-17', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 25, passingMarks: 9, status: 'Completed' },
  { id: 'sch-008', examId: 'exam-002', subject: 'English', className: '1-A', date: '2026-09-19', startTime: '09:00 AM', endTime: '10:30 AM', maxMarks: 25, passingMarks: 9, status: 'Completed' },
];

export const INITIAL_SCHEDULES = INITIAL_EXAM_SCHEDULES;

export const INITIAL_MARKS_RECORDS = [
  // Class 10-A Mid-Term Mathematics (exam-001)
  { id: 'm-001', examId: 'exam-001', className: '10-A', subject: 'Mathematics', studentId: 'STU-2026-0015', studentName: 'Aditi Sharma', rollNumber: 1, maxMarks: 100, obtainedMarks: 82, isAbsent: false, status: 'Submitted', teacher: 'Deepak Kumar' },
  { id: 'm-002', examId: 'exam-001', className: '10-A', subject: 'Mathematics', studentId: 'STU-2026-0001', studentName: 'Ayesha Abbasi', rollNumber: 2, maxMarks: 100, obtainedMarks: 74, isAbsent: false, status: 'Submitted', teacher: 'Deepak Kumar' },
  { id: 'm-003', examId: 'exam-001', className: '10-A', subject: 'Mathematics', studentId: 'STU-2026-0002', studentName: 'Anas Kashyap', rollNumber: 3, maxMarks: 100, obtainedMarks: 89, isAbsent: false, status: 'Submitted', teacher: 'Deepak Kumar' },
  { id: 'm-004', examId: 'exam-001', className: '10-A', subject: 'Mathematics', studentId: 'STU-2026-0003', studentName: 'Kabir Jain', rollNumber: 4, maxMarks: 100, obtainedMarks: 93, isAbsent: false, status: 'Submitted', teacher: 'Deepak Kumar' },
  { id: 'm-005', examId: 'exam-001', className: '10-A', subject: 'Mathematics', studentId: 'STU-2026-0004', studentName: 'Kavya Sharma', rollNumber: 5, maxMarks: 100, obtainedMarks: 68, isAbsent: false, status: 'Submitted', teacher: 'Deepak Kumar' },
  { id: 'm-006', examId: 'exam-001', className: '10-A', subject: 'Mathematics', studentId: 'STU-2026-0012', studentName: 'Rahul Kumar', rollNumber: 12, maxMarks: 100, obtainedMarks: 38, isAbsent: false, status: 'Submitted', teacher: 'Deepak Kumar' },

  // Class 10-A Mid-Term English (exam-001)
  { id: 'm-010', examId: 'exam-001', className: '10-A', subject: 'English', studentId: 'STU-2026-0015', studentName: 'Aditi Sharma', rollNumber: 1, maxMarks: 100, obtainedMarks: 91, isAbsent: false, status: 'Submitted', teacher: 'Aisha Siddiqui' },
  { id: 'm-011', examId: 'exam-001', className: '10-A', subject: 'English', studentId: 'STU-2026-0001', studentName: 'Ayesha Abbasi', rollNumber: 2, maxMarks: 100, obtainedMarks: 85, isAbsent: false, status: 'Submitted', teacher: 'Aisha Siddiqui' },
  { id: 'm-012', examId: 'exam-001', className: '10-A', subject: 'English', studentId: 'STU-2026-0002', studentName: 'Anas Kashyap', rollNumber: 3, maxMarks: 100, obtainedMarks: 78, isAbsent: false, status: 'Submitted', teacher: 'Aisha Siddiqui' },
  { id: 'm-013', examId: 'exam-001', className: '10-A', subject: 'English', studentId: 'STU-2026-0003', studentName: 'Kabir Jain', rollNumber: 4, maxMarks: 100, obtainedMarks: 90, isAbsent: false, status: 'Submitted', teacher: 'Aisha Siddiqui' },

  // Class 10-A Mid-Term Science (exam-001)
  { id: 'm-020', examId: 'exam-001', className: '10-A', subject: 'Science', studentId: 'STU-2026-0015', studentName: 'Aditi Sharma', rollNumber: 1, maxMarks: 100, obtainedMarks: 95, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-021', examId: 'exam-001', className: '10-A', subject: 'Science', studentId: 'STU-2026-0001', studentName: 'Ayesha Abbasi', rollNumber: 2, maxMarks: 100, obtainedMarks: 82, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },
  { id: 'm-022', examId: 'exam-001', className: '10-A', subject: 'Science', studentId: 'STU-2026-0003', studentName: 'Kabir Jain', rollNumber: 4, maxMarks: 100, obtainedMarks: 88, isAbsent: false, status: 'Submitted', teacher: 'Anjali Singh' },

  // Class 1-A Unit Test 1 EVS (exam-002)
  { id: 'm-030', examId: 'exam-002', className: '1-A', subject: 'EVS', studentId: 'STU-2026-0001', studentName: 'Ayesha Abbasi', rollNumber: 1, maxMarks: 25, obtainedMarks: 22, isAbsent: false, status: 'Submitted', teacher: 'Sana Parveen' },
  { id: 'm-031', examId: 'exam-002', className: '1-A', subject: 'EVS', studentId: 'STU-2026-0002', studentName: 'Anas Kashyap', rollNumber: 2, maxMarks: 25, obtainedMarks: 19, isAbsent: false, status: 'Submitted', teacher: 'Sana Parveen' },
];
