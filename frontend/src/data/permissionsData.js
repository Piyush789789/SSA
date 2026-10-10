/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Centralized Permission Definitions & Categories
 */

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
      { id: 'notices.publish', label: 'Post on Notice Board' },
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
  {
    id: 'other',
    label: 'OTHER',
    permissions: [
      { id: 'library.manage', label: 'Manage Library' },
      { id: 'dailyChallenge', label: 'Daily Challenge' },
      { id: 'badges.award', label: 'Award Badges' },
    ],
  },
];
