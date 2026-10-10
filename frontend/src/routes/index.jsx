import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Pages
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
import { ClassesListPage } from '@/pages/admin/ClassesListPage';
import { ClassDetailPage } from '@/pages/admin/ClassDetailPage';
import { ExamsPage } from '@/pages/admin/ExamsPage';
import { ExamDetailPage } from '@/pages/admin/ExamDetailPage';

// Teacher Layout & Pages
import { TeacherLayout } from '@/layouts/TeacherLayout';
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { TeacherAttendancePage } from '@/pages/teacher/TeacherAttendancePage';
import { TeacherHomeworkPage } from '@/pages/teacher/TeacherHomeworkPage';
import { TeacherExamsPage } from '@/pages/teacher/TeacherExamsPage';
import { TeacherMarksEntryPage } from '@/pages/teacher/TeacherMarksEntryPage';
import { TeacherTimetablePage } from '@/pages/teacher/TeacherTimetablePage';
import { TeacherNoticesPage } from '@/pages/teacher/TeacherNoticesPage';
import { TeacherCommunicationPage } from '@/pages/teacher/TeacherCommunicationPage';
import { TeacherAIAssistantPage } from '@/pages/teacher/TeacherAIAssistantPage';
import { TeacherStudyMaterialsPage } from '@/pages/teacher/TeacherStudyMaterialsPage';
import { TeacherProfilePage } from '@/pages/teacher/TeacherProfilePage';

// Student Layout & Pages
import { StudentLayout } from '@/layouts/StudentLayout';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentAttendancePage as StudentSelfAttendancePage } from '@/pages/student/StudentAttendancePage';
import { StudentFeesPage } from '@/pages/student/StudentFeesPage';
import { StudentHomeworkPage as StudentSelfHomeworkPage } from '@/pages/student/StudentHomeworkPage';
import { StudentExamsPage as StudentSelfExamsPage } from '@/pages/student/StudentExamsPage';
import { StudentNoticesPage as StudentSelfNoticesPage } from '@/pages/student/StudentNoticesPage';
import { StudentCommunicationPage as StudentSelfCommunicationPage } from '@/pages/student/StudentCommunicationPage';
import { StudentReportCardPage } from '@/pages/student/StudentReportCardPage';
import { StudentProgressPage } from '@/pages/student/StudentProgressPage';
import { StudentAIAssistantPage as StudentSelfAIAssistantPage } from '@/pages/student/StudentAIAssistantPage';
import { StudentStudyMaterialsPage as StudentSelfStudyMaterialsPage } from '@/pages/student/StudentStudyMaterialsPage';
import { StudentProfilePage as StudentSelfProfilePage } from '@/pages/student/StudentProfilePage';

// Parent Layout & Pages
import { ParentLayout } from '@/layouts/ParentLayout';
import { ParentDashboard } from '@/pages/parent/ParentDashboard';
import { ParentAttendancePage } from '@/pages/parent/ParentAttendancePage';
import { ParentResultsPage } from '@/pages/parent/ParentResultsPage';
import { ParentFeesPage } from '@/pages/parent/ParentFeesPage';
import { ParentNoticesPage } from '@/pages/parent/ParentNoticesPage';
import { ParentCommunicationPage } from '@/pages/parent/ParentCommunicationPage';
import { ParentProfilePage } from '@/pages/parent/ParentProfilePage';

import { ROUTES } from '@/constants/routes';

import { HOME_BY_ROLE, RequireRole } from '@/routes/RequireRole';

const AdminRoute = ({ children }) => <RequireRole role="admin">{children}</RequireRole>;

/** "/" and unknown addresses: signed-in users go to their portal, everyone else to the login page. */
const HomeRedirect = () => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={currentUser ? HOME_BY_ROLE[currentUser.role] : ROUTES.LOGIN} replace />;
};

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomeRedirect />,
  },
  {
    path: '*',
    element: <HomeRedirect />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />,
  },

  // ADMIN ROUTES (Protected from Teacher access)
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_STUDENTS,
    element: (
      <AdminRoute>
        <StudentsPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_CLASSES,
    element: (
      <AdminRoute>
        <ClassesListPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.CLASSES,
    element: (
      <AdminRoute>
        <ClassesListPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/classes/:classId',
    element: (
      <AdminRoute>
        <ClassDetailPage />
      </AdminRoute>
    ),
  },
  {
    path: '/classes/:classId',
    element: (
      <AdminRoute>
        <ClassDetailPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_ADD_STUDENT,
    element: (
      <AdminRoute>
        <AddStudentPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/students/:studentId',
    element: (
      <AdminRoute>
        <StudentProfile />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_TEACHERS,
    element: (
      <AdminRoute>
        <TeachersPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_ATTENDANCE,
    element: (
      <AdminRoute>
        <AttendancePage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ATTENDANCE,
    element: (
      <AdminRoute>
        <AttendancePage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/attendance/student/:studentId',
    element: (
      <AdminRoute>
        <StudentAttendancePage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.FEES,
    element: (
      <AdminRoute>
        <FeesPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_TIMETABLE,
    element: (
      <AdminRoute>
        <TimetablePage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_NOTICES,
    element: (
      <AdminRoute>
        <NoticeBoardPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.NOTICES,
    element: (
      <AdminRoute>
        <NoticeBoardPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_ROLES_PERMISSIONS,
    element: (
      <AdminRoute>
        <RolesPermissionsPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ROLES_PERMISSIONS,
    element: (
      <AdminRoute>
        <RolesPermissionsPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_EXAMS,
    element: (
      <AdminRoute>
        <ExamsPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.EXAMS,
    element: (
      <AdminRoute>
        <ExamsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/exams/:examId',
    element: (
      <AdminRoute>
        <ExamDetailPage />
      </AdminRoute>
    ),
  },

  // TEACHER ROUTES
  {
    path: '/teacher',
    element: (
      <RequireRole role="teacher">
        <TeacherLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/teacher/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <TeacherDashboard />,
      },
      {
        path: 'attendance',
        element: <TeacherAttendancePage />,
      },
      {
        path: 'homework',
        element: <TeacherHomeworkPage />,
      },
      {
        path: 'exams',
        element: <TeacherExamsPage />,
      },
      {
        path: 'exams/:examId/marks',
        element: <TeacherMarksEntryPage />,
      },
      {
        path: 'timetable',
        element: <TeacherTimetablePage />,
      },
      {
        path: 'notices',
        element: <TeacherNoticesPage />,
      },
      {
        path: 'communication',
        element: <TeacherCommunicationPage />,
      },
      {
        path: 'ai-assistant',
        element: <TeacherAIAssistantPage />,
      },
      {
        path: 'study-materials',
        element: <TeacherStudyMaterialsPage />,
      },
      {
        path: 'profile',
        element: <TeacherProfilePage />,
      },
    ],
  },

  // STUDENT ROUTES
  {
    path: '/student',
    element: (
      <RequireRole role="student">
        <StudentLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <StudentDashboard />,
      },
      {
        path: 'attendance',
        element: <StudentSelfAttendancePage />,
      },
      {
        path: 'fees',
        element: <StudentFeesPage />,
      },
      {
        path: 'homework',
        element: <StudentSelfHomeworkPage />,
      },
      {
        path: 'exams',
        element: <StudentSelfExamsPage />,
      },
      {
        path: 'notices',
        element: <StudentSelfNoticesPage />,
      },
      {
        path: 'communication',
        element: <StudentSelfCommunicationPage />,
      },
      {
        path: 'report-card',
        element: <StudentReportCardPage />,
      },
      {
        path: 'progress',
        element: <StudentProgressPage />,
      },
      {
        path: 'ai-assistant',
        element: <StudentSelfAIAssistantPage />,
      },
      {
        path: 'study-materials',
        element: <StudentSelfStudyMaterialsPage />,
      },
      {
        path: 'profile',
        element: <StudentSelfProfilePage />,
      },
    ],
  },

  // PARENT ROUTES
  {
    path: '/parent',
    element: (
      <RequireRole role="parent">
        <ParentLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/parent/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <ParentDashboard />,
      },
      {
        path: 'attendance',
        element: <ParentAttendancePage />,
      },
      {
        path: 'results',
        element: <ParentResultsPage />,
      },
      {
        path: 'fees',
        element: <ParentFeesPage />,
      },
      {
        path: 'notices',
        element: <ParentNoticesPage />,
      },
      {
        path: 'communication',
        element: <ParentCommunicationPage />,
      },
      {
        path: 'profile',
        element: <ParentProfilePage />,
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
