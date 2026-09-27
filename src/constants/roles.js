import { Shield, BookOpen, GraduationCap, Heart } from 'lucide-react';

export const ROLES = [
  {
    id: 'Admin',
    label: 'Admin',
    icon: Shield,
    colorClass: 'bg-orange-100/80 text-orange-600',
  },
  {
    id: 'Teacher',
    label: 'Teacher',
    icon: BookOpen,
    colorClass: 'bg-cyan-100/80 text-cyan-600',
  },
  {
    id: 'Student',
    label: 'Student',
    icon: GraduationCap,
    colorClass: 'bg-indigo-100/80 text-indigo-600',
  },
  {
    id: 'Parent',
    label: 'Parent',
    icon: Heart,
    colorClass: 'bg-amber-100/80 text-amber-600',
  },
];
