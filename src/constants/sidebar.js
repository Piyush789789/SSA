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
