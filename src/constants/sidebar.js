import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  DollarSign,
  Calendar,
  Megaphone,
  ShieldCheck,
  FileCheck,
  BookOpenCheck,
  MessageSquare,
  Sparkles,
  Library,
  Award,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'classes', label: 'Classes', icon: Building2 },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'fees', label: 'Fees', icon: DollarSign },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'notice-board', label: 'Notice Board', icon: Megaphone },
  { id: 'exams', label: 'Tests & Exams', icon: FileCheck },
  { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldCheck },
];

export const TEACHER_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/teacher/dashboard' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, route: '/teacher/attendance' },
  { id: 'homework', label: 'Homework', icon: BookOpenCheck, route: '/teacher/homework' },
  { id: 'exams', label: 'Tests & Exams', icon: FileCheck, route: '/teacher/exams' },
  { id: 'timetable', label: 'Timetable', icon: Calendar, route: '/teacher/timetable' },
  { id: 'notices', label: 'Notices', icon: Megaphone, route: '/teacher/notices' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, route: '/teacher/communication' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, route: '/teacher/ai-assistant' },
  { id: 'study-materials', label: 'Study Materials', icon: Library, route: '/teacher/study-materials' },
];

export const STUDENT_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/student/dashboard' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, route: '/student/attendance' },
  { id: 'fees', label: 'Fee Details', icon: CreditCard, route: '/student/fees' },
  { id: 'homework', label: 'Homework', icon: BookOpenCheck, route: '/student/homework' },
  { id: 'exams', label: 'Tests & Exams', icon: FileCheck, route: '/student/exams' },
  { id: 'notices', label: 'Notices', icon: Megaphone, route: '/student/notices' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, route: '/student/communication' },
  { id: 'report-card', label: 'Report Card', icon: Award, route: '/student/report-card' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, route: '/student/progress' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, route: '/student/ai-assistant' },
  { id: 'study-materials', label: 'Study Materials', icon: Library, route: '/student/study-materials' },
];

export const PARENT_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/parent/dashboard' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, route: '/parent/attendance' },
  { id: 'results', label: 'Results', icon: Award, route: '/parent/results' },
  { id: 'fees', label: 'Fees', icon: CreditCard, route: '/parent/fees' },
  { id: 'notices', label: 'Notices', icon: Megaphone, route: '/parent/notices' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, route: '/parent/communication' },
];


