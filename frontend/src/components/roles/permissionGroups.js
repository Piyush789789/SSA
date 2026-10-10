/** Permission switches shown on the Roles & Permissions page (pure UI definitions). */
export const PERMISSION_GROUPS = [
  {
    id: 'students',
    label: 'STUDENTS',
    permissions: [
      { id: 'students.view', label: 'View All Students' },
      { id: 'students.create', label: 'Create Student' },
      { id: 'students.edit', label: 'Edit Student' },
      { id: 'students.delete', label: 'Delete Student' },
    ],
  },
  {
    id: 'attendance',
    label: 'ATTENDANCE',
    permissions: [
      { id: 'attendance.view', label: 'View Attendance' },
      { id: 'attendance.mark', label: 'Mark Attendance' },
    ],
  },
  {
    id: 'exams',
    label: 'EXAMS & RESULTS',
    permissions: [
      { id: 'exams.view', label: 'View Exams' },
      { id: 'exams.create', label: 'Create Exam' },
      { id: 'exams.enterMarks', label: 'Enter Marks' },
    ],
  },
  {
    id: 'homework',
    label: 'HOMEWORK',
    permissions: [
      { id: 'homework.view', label: 'View Homework' },
      { id: 'homework.assign', label: 'Assign Homework' },
    ],
  },
  {
    id: 'notices',
    label: 'NOTICE BOARD',
    permissions: [
      { id: 'notices.view', label: 'View Notices' },
      { id: 'notices.post', label: 'Post Notice' },
    ],
  },
  {
    id: 'fees',
    label: 'FEES',
    permissions: [
      { id: 'fees.view', label: 'View Fees' },
      { id: 'fees.manage', label: 'Manage Fees' },
    ],
  },
];

/**
 * What the server currently lets every teacher do (fixed role rules, limited to their own classes/subjects).
 * Used as each teacher's starting state because there is no permissions API to load per-teacher settings from.
 */
export const SERVER_TEACHER_RULES = {
  'students.view': true,
  'students.create': false,
  'students.edit': false,
  'students.delete': false,
  'attendance.view': true,
  'attendance.mark': true,
  'exams.view': true,
  'exams.create': false,
  'exams.enterMarks': true,
  'homework.view': true,
  'homework.assign': true,
  'notices.view': true,
  'notices.post': true,
  'fees.view': false,
  'fees.manage': false,
};
