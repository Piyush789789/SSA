import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { StudentsPage } from '@/pages/admin/StudentsPage';
import { StudentProfile } from '@/pages/admin/StudentProfile';
import { AddStudentPage } from '@/pages/admin/AddStudentPage';
import { TeachersPage } from '@/pages/admin/TeachersPage';
import { FeesPage } from '@/pages/admin/FeesPage';
import { TimetablePage } from '@/pages/admin/TimetablePage';
import { NoticeBoardPage } from '@/pages/admin/NoticeBoardPage';
import { RolesPermissionsPage } from '@/pages/admin/RolesPermissionsPage';
import { AttendancePage } from '@/pages/admin/AttendancePage';
import { StudentAttendancePage } from '@/pages/admin/StudentAttendancePage';
import { ROUTES } from '@/constants/routes';

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />,
  },
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: <AdminDashboard />,
  },
  {
    path: ROUTES.ADMIN_STUDENTS,
    element: <StudentsPage />,
  },
  {
    path: ROUTES.ADMIN_ADD_STUDENT,
    element: <AddStudentPage />,
  },
  {
    path: '/admin/students/:studentId',
    element: <StudentProfile />,
  },
  {
    path: ROUTES.ADMIN_TEACHERS,
    element: <TeachersPage />,
  },
  {
    path: ROUTES.ADMIN_ATTENDANCE,
    element: <AttendancePage />,
  },
  {
    path: ROUTES.ATTENDANCE,
    element: <AttendancePage />,
  },
  {
    path: '/admin/attendance/student/:studentId',
    element: <StudentAttendancePage />,
  },
  {
    path: ROUTES.FEES,
    element: <FeesPage />,
  },
  {
    path: ROUTES.ADMIN_TIMETABLE,
    element: <TimetablePage />,
  },
  {
    path: ROUTES.ADMIN_NOTICES,
    element: <NoticeBoardPage />,
  },
  {
    path: ROUTES.NOTICES,
    element: <NoticeBoardPage />,
  },
  {
    path: ROUTES.ADMIN_ROLES_PERMISSIONS,
    element: <RolesPermissionsPage />,
  },
  {
    path: ROUTES.ROLES_PERMISSIONS,
    element: <RolesPermissionsPage />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
