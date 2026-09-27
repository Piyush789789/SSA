/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Dashboard Centralized Mock Data
 */

export const dashboardStats = [
  {
    id: 'students',
    title: 'Total Students',
    value: '161',
    type: 'students',
    gradient: 'from-[#FF7A45] to-[#FA5A19]',
    iconBg: 'bg-white/20',
  },
  {
    id: 'teachers',
    title: 'Total Teachers',
    value: '22',
    type: 'teachers',
    gradient: 'from-[#6979F8] to-[#4A54E1]',
    iconBg: 'bg-white/20',
  },
  {
    id: 'attendance',
    title: 'Attendance Rate',
    value: '—',
    type: 'attendance',
    gradient: 'from-[#36CFC9] to-[#08979C]',
    iconBg: 'bg-white/20',
  },
  {
    id: 'fees',
    title: 'Fee Collection',
    value: '₹1,539,000',
    type: 'fees',
    gradient: 'from-[#FF7A45] to-[#E04E15]',
    iconBg: 'bg-white/20',
  },
];

export const attendanceData = [
  { day: 'Thu', students: 155 },
  { day: 'Fri', students: 150 },
  { day: 'Sat', students: 155 },
  { day: 'Sun', students: 0 },
  { day: 'Mon', students: 145 },
  { day: 'Tue', students: 0 },
  { day: 'Wed', students: 0 },
];

export const feeCollectionData = [
  { month: 'Mar', amount: 330000, color: '#FF7A45' },
  { month: 'Apr', amount: 570000, color: '#FF7A45' },
  { month: 'May', amount: 0, color: '#FF7A45' },
  { month: 'Jun', amount: 0, color: '#FF7A45' },
  { month: 'Jul', amount: 600000, color: '#FF7A45' },
  { month: 'Aug', amount: 875000, color: '#06B6D4' },
];

export const classPerformanceData = [
  { class: 'Class 1', score: 88 },
  { class: 'Class 2', score: 92 },
  { class: 'Class 3', score: 85 },
  { class: 'Class 4', score: 90 },
  { class: 'Class 5', score: 86 },
  { class: 'Class 6', score: 94 },
  { class: 'Class 7', score: 89 },
  { class: 'Class 8', score: 91 },
  { class: 'Class 9', score: 87 },
  { class: 'Class 10', score: 95 },
];

export const recentActivities = [
  {
    id: 1,
    title: 'Student enrolled',
    subtitle: 'Zafar — Class 9',
    time: '2 mins ago',
    type: 'enrollment',
  },
  {
    id: 2,
    title: 'Teacher added',
    subtitle: 'Mrs. Ananya Sharma (Science Dept)',
    time: '1 hour ago',
    type: 'teacher',
  },
  {
    id: 3,
    title: 'Fee payment recorded',
    subtitle: '₹15,000 for Rahul Verma (Class 10)',
    time: '3 hours ago',
    type: 'fee',
  },
  {
    id: 4,
    title: 'Notice published',
    subtitle: 'Annual Sports Day 2026 Schedule',
    time: 'Yesterday',
    type: 'notice',
  },
  {
    id: 5,
    title: 'Attendance marked',
    subtitle: 'Class 8-A (98% present)',
    time: '2 days ago',
    type: 'attendance',
  },
];

export const upcomingExams = [
  {
    id: 1,
    title: 'Unit Test 2 — English',
    date: 'Aug 28, 2026',
    daysRemaining: 'In 9 days',
  },
  {
    id: 2,
    title: 'Unit Test 2 — English',
    date: 'Aug 28, 2026',
    daysRemaining: 'In 9 days',
  },
  {
    id: 3,
    title: 'Unit Test 2 — English',
    date: 'Aug 28, 2026',
    daysRemaining: 'In 9 days',
  },
  {
    id: 4,
    title: 'Unit Test 2 — English',
    date: 'Aug 28, 2026',
    daysRemaining: 'In 9 days',
  },
  {
    id: 5,
    title: 'Unit Test 2 — English',
    date: 'Aug 28, 2026',
    daysRemaining: 'In 9 days',
  },
];

export const pendingFees = [
  {
    id: 1,
    name: 'Areeba Ansari',
    initials: 'AA',
    classExam: '1-A · Examination',
    feePeriod: 'Fee — Half Yearly · Aug 2026',
    amount: '₹800',
    status: 'pending',
  },
  {
    id: 2,
    name: 'Ayesha Siddiqui',
    initials: 'AS',
    classExam: '1-A · Examination',
    feePeriod: 'Fee — Half Yearly · Aug 2026',
    amount: '₹800',
    status: 'pending',
  },
  {
    id: 3,
    name: 'Aditi Sharma',
    initials: 'AS',
    classExam: '1-B · Examination',
    feePeriod: 'Fee — Half Yearly · Aug 2026',
    amount: '₹800',
    status: 'pending',
  },
  {
    id: 4,
    name: 'Danish Rastogi',
    initials: 'DR',
    classExam: '1-A · Examination',
    feePeriod: 'Fee — Half Yearly · Aug 2026',
    amount: '₹800',
    status: 'pending',
  },
  {
    id: 5,
    name: 'Anas Kashyap',
    initials: 'AK',
    classExam: '1-A · Examination',
    feePeriod: 'Fee — Half Yearly · Aug 2026',
    amount: '₹800',
    status: 'pending',
  },
  {
    id: 6,
    name: 'Kabir Jain',
    initials: 'KJ',
    classExam: '1-A · Examination',
    feePeriod: 'Fee — Half Yearly · Aug 2026',
    amount: '₹800',
    status: 'pending',
  },
];

export const upcomingEvents = [
  {
    id: 1,
    title: 'Parent–Teacher Meeting',
    date: 'Aug 22',
  },
  {
    id: 2,
    title: 'Health Check-up Camp',
    date: 'Aug 24',
  },
  {
    id: 3,
    title: 'Career Counselling Session (Class 9–10)',
    date: 'Aug 26',
  },
  {
    id: 4,
    title: 'Unit Test 2',
    date: 'Aug 28',
  },
  {
    id: 5,
    title: 'Inter-House Debate Competition',
    date: 'Aug 29',
  },
];
