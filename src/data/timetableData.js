/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Centralized Timetable Mock Data & Configuration
 */

export const INITIAL_PERIODS = [
  { id: 'period-1', label: 'Period 1', startTime: '08:00', endTime: '08:45', type: 'period' },
  { id: 'period-2', label: 'Period 2', startTime: '08:45', endTime: '09:30', type: 'period' },
  { id: 'period-3', label: 'Period 3', startTime: '09:30', endTime: '10:15', type: 'period' },
  { id: 'break-1', label: 'Short Break', startTime: '10:15', endTime: '10:30', type: 'break' },
  { id: 'period-4', label: 'Period 4', startTime: '10:30', endTime: '11:15', type: 'period' },
  { id: 'period-5', label: 'Period 5', startTime: '11:15', endTime: '12:00', type: 'period' },
  { id: 'lunch-1', label: 'Lunch Break', startTime: '12:00', endTime: '12:40', type: 'break' },
  { id: 'period-6', label: 'Period 6', startTime: '12:40', endTime: '13:25', type: 'period' },
  { id: 'period-7', label: 'Period 7', startTime: '13:25', endTime: '14:10', type: 'period' },
  { id: 'period-8', label: 'Period 8', startTime: '14:10', endTime: '14:55', type: 'period' },
];

export const SUBJECTS_LIST = [
  {
    id: 'english',
    name: 'English',
    code: 'ENG',
    colorBg: 'bg-white',
    colorText: 'text-slate-900',
    colorBorder: 'border-slate-800',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'evs',
    name: 'Environmental Studies',
    code: 'EVS',
    colorBg: 'bg-emerald-50/90',
    colorText: 'text-emerald-900',
    colorBorder: 'border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'gk',
    name: 'General Knowledge',
    code: 'GK',
    colorBg: 'bg-amber-50/90',
    colorText: 'text-amber-900',
    colorBorder: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'hindi',
    name: 'Hindi',
    code: 'HIN',
    colorBg: 'bg-indigo-50/90',
    colorText: 'text-indigo-900',
    colorBorder: 'border-indigo-200',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'cs',
    name: 'Computer Science',
    code: 'CS',
    colorBg: 'bg-purple-50/90',
    colorText: 'text-purple-900',
    colorBorder: 'border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'isl',
    name: 'Islamic Studies',
    code: 'ISL',
    colorBg: 'bg-fuchsia-50/90',
    colorText: 'text-fuchsia-900',
    colorBorder: 'border-fuchsia-200',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  },
  {
    id: 'math',
    name: 'Mathematics',
    code: 'MAT',
    colorBg: 'bg-orange-50/90',
    colorText: 'text-orange-900',
    colorBorder: 'border-orange-200',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    id: 'art',
    name: 'Art & Craft',
    code: 'ART',
    colorBg: 'bg-sky-50/90',
    colorText: 'text-sky-900',
    colorBorder: 'border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 'sci',
    name: 'Science',
    code: 'SCI',
    colorBg: 'bg-teal-50/90',
    colorText: 'text-teal-900',
    colorBorder: 'border-teal-200',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    id: 'sst',
    name: 'Social Science',
    code: 'SST',
    colorBg: 'bg-violet-50/90',
    colorText: 'text-violet-900',
    colorBorder: 'border-violet-200',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  {
    id: 'phy',
    name: 'Physics',
    code: 'PHY',
    colorBg: 'bg-rose-50/90',
    colorText: 'text-rose-900',
    colorBorder: 'border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
];

export const TIMETABLE_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

// Initial Timetable Grid Entries for Class 1-A (Matching Screenshot)
export const INITIAL_TIMETABLE_ENTRIES = [
  // MONDAY
  { classId: '1-A', day: 'MONDAY', periodId: 'period-1', subjectId: 'english', teacherName: 'Neha Gupta', substituteTeacherName: null },
  { classId: '1-A', day: 'MONDAY', periodId: 'period-2', subjectId: 'hindi', teacherName: 'Farhat Jahan', substituteTeacherName: null },
  { classId: '1-A', day: 'MONDAY', periodId: 'period-3', subjectId: 'math', teacherName: 'Mohd Arif Khan', substituteTeacherName: null },
  { classId: '1-A', day: 'MONDAY', periodId: 'period-4', subjectId: 'evs', teacherName: 'Javed Akhtar', substituteTeacherName: null },
  { classId: '1-A', day: 'MONDAY', periodId: 'period-5', subjectId: 'cs', teacherName: 'Priya Verma', substituteTeacherName: null },

  // TUESDAY
  { classId: '1-A', day: 'TUESDAY', periodId: 'period-1', subjectId: 'evs', teacherName: 'Javed Akhtar', substituteTeacherName: null },
  { classId: '1-A', day: 'TUESDAY', periodId: 'period-2', subjectId: 'cs', teacherName: 'Sunil Rathore', substituteTeacherName: null },
  { classId: '1-A', day: 'TUESDAY', periodId: 'period-3', subjectId: 'art', teacherName: 'Rehana Begum', substituteTeacherName: null },
  { classId: '1-A', day: 'TUESDAY', periodId: 'period-4', subjectId: 'gk', teacherName: 'Aisha Siddiqui', substituteTeacherName: null },
  { classId: '1-A', day: 'TUESDAY', periodId: 'period-5', subjectId: 'isl', teacherName: 'Nazia Sultana', substituteTeacherName: null },

  // WEDNESDAY
  { classId: '1-A', day: 'WEDNESDAY', periodId: 'period-1', subjectId: 'gk', teacherName: 'Sunil Rathore', substituteTeacherName: null },
  { classId: '1-A', day: 'WEDNESDAY', periodId: 'period-2', subjectId: 'isl', teacherName: 'Nazia Sultana', substituteTeacherName: null },
  { classId: '1-A', day: 'WEDNESDAY', periodId: 'period-3', subjectId: 'english', teacherName: 'Sana Parveen', substituteTeacherName: null },
  { classId: '1-A', day: 'WEDNESDAY', periodId: 'period-4', subjectId: 'hindi', teacherName: 'Tabassum Bano', substituteTeacherName: null },
  { classId: '1-A', day: 'WEDNESDAY', periodId: 'period-5', subjectId: 'math', teacherName: 'Deepak Kumar', substituteTeacherName: null },

  // THURSDAY
  { classId: '1-A', day: 'THURSDAY', periodId: 'period-1', subjectId: 'hindi', teacherName: 'Farhat Jahan', substituteTeacherName: null },
  { classId: '1-A', day: 'THURSDAY', periodId: 'period-2', subjectId: 'math', teacherName: 'Deepak Kumar', substituteTeacherName: null },
  { classId: '1-A', day: 'THURSDAY', periodId: 'period-3', subjectId: 'evs', teacherName: 'Javed Akhtar', substituteTeacherName: null },
  { classId: '1-A', day: 'THURSDAY', periodId: 'period-4', subjectId: 'cs', teacherName: 'Sunil Rathore', substituteTeacherName: null },
  { classId: '1-A', day: 'THURSDAY', periodId: 'period-5', subjectId: 'art', teacherName: 'Rehana Begum', substituteTeacherName: null },

  // FRIDAY
  { classId: '1-A', day: 'FRIDAY', periodId: 'period-1', subjectId: 'cs', teacherName: 'Sunil Rathore', substituteTeacherName: null },
  { classId: '1-A', day: 'FRIDAY', periodId: 'period-2', subjectId: 'art', teacherName: 'Rehana Begum', substituteTeacherName: null },
  { classId: '1-A', day: 'FRIDAY', periodId: 'period-3', subjectId: 'gk', teacherName: 'Mohd Arif Khan', substituteTeacherName: null },
  { classId: '1-A', day: 'FRIDAY', periodId: 'period-4', subjectId: 'isl', teacherName: 'Nazia Sultana', substituteTeacherName: null },
  { classId: '1-A', day: 'FRIDAY', periodId: 'period-5', subjectId: 'english', teacherName: 'Neha Gupta', substituteTeacherName: null },

  // SATURDAY
  { classId: '1-A', day: 'SATURDAY', periodId: 'period-1', subjectId: 'isl', teacherName: 'Nazia Sultana', substituteTeacherName: null },
  { classId: '1-A', day: 'SATURDAY', periodId: 'period-2', subjectId: 'english', teacherName: 'Sana Parveen', substituteTeacherName: null },
  { classId: '1-A', day: 'SATURDAY', periodId: 'period-3', subjectId: 'hindi', teacherName: 'Farhat Jahan', substituteTeacherName: null },
  { classId: '1-A', day: 'SATURDAY', periodId: 'period-4', subjectId: 'math', teacherName: 'Deepak Kumar', substituteTeacherName: null },
  { classId: '1-A', day: 'SATURDAY', periodId: 'period-5', subjectId: 'evs', teacherName: 'Javed Akhtar', substituteTeacherName: null },
];
