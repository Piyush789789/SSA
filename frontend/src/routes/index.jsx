import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// The login page and the portal layouts load up front; every other page is loaded on demand
// (route-level code splitting). Portal layouts show a spinner inside the page area while a page loads.
import { LoginPage } from '@/pages/LoginPage';
import { TeacherLayout } from '@/layouts/TeacherLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { ParentLayout } from '@/layouts/ParentLayout';

import { ROUTES } from '@/constants/routes';

import { HOME_BY_ROLE, RequireRole } from '@/routes/RequireRole';
import { LoadingMessage } from '@/components/common/AsyncState';
import { ForcedPasswordChange } from '@/components/common/ChangePassword';

/** React.lazy for a module's named export. */
const named = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));

// Admin pages
const AdminDashboard = named(() => import('@/pages/admin/AdminDashboard'), 'AdminDashboard');
const StudentsPage = named(() => import('@/pages/admin/StudentsPage'), 'StudentsPage');
const StudentProfile = named(() => import('@/pages/admin/StudentProfile'), 'StudentProfile');
const AddStudentPage = named(() => import('@/pages/admin/AddStudentPage'), 'AddStudentPage');
const TeachersPage = named(() => import('@/pages/admin/TeachersPage'), 'TeachersPage');
const FeesPage = named(() => import('@/pages/admin/FeesPage'), 'FeesPage');
const TimetablePage = named(() => import('@/pages/admin/TimetablePage'), 'TimetablePage');
const NoticeBoardPage = named(() => import('@/pages/admin/NoticeBoardPage'), 'NoticeBoardPage');
const RolesPermissionsPage = named(() => import('@/pages/admin/RolesPermissionsPage'), 'RolesPermissionsPage');
const AccountsPage = named(() => import('@/pages/admin/AccountsPage'), 'AccountsPage');
const AttendancePage = named(() => import('@/pages/admin/AttendancePage'), 'AttendancePage');
const StudentAttendancePage = named(() => import('@/pages/admin/StudentAttendancePage'), 'StudentAttendancePage');
const ClassesListPage = named(() => import('@/pages/admin/ClassesListPage'), 'ClassesListPage');
const ClassDetailPage = named(() => import('@/pages/admin/ClassDetailPage'), 'ClassDetailPage');
const ExamsPage = named(() => import('@/pages/admin/ExamsPage'), 'ExamsPage');
const ExamDetailPage = named(() => import('@/pages/admin/ExamDetailPage'), 'ExamDetailPage');
const SchoolSettingsPage = named(() => import('@/pages/admin/SchoolSettingsPage'), 'SchoolSettingsPage');
const PromotionPage = named(() => import('@/pages/admin/PromotionPage'), 'PromotionPage');
const BackupsPage = named(() => import('@/pages/admin/BackupsPage'), 'BackupsPage');
const AuditLogPage = named(() => import('@/pages/admin/AuditLogPage'), 'AuditLogPage');
const CertificatesPage = named(() => import('@/pages/admin/CertificatesPage'), 'CertificatesPage');
const CalendarAdminPage = named(() => import('@/pages/admin/CalendarAdminPage'), 'CalendarAdminPage');
const LeaveRequestsPage = named(() => import('@/pages/admin/LeaveRequestsPage'), 'LeaveRequestsPage');
const StaffAttendancePage = named(() => import('@/pages/admin/StaffAttendancePage'), 'StaffAttendancePage');
const SubstitutionsPage = named(() => import('@/pages/admin/SubstitutionsPage'), 'SubstitutionsPage');
const ImportStudentsPage = named(() => import('@/pages/admin/ImportStudentsPage'), 'ImportStudentsPage');

// Printable pages (any signed-in user; the backend checks access)
const ReportCardPrintPage = named(() => import('@/pages/print/ReportCardPrintPage'), 'ReportCardPrintPage');
const CertificatePrintPage = named(() => import('@/pages/print/CertificatePrintPage'), 'CertificatePrintPage');
const AdmitCardPrintPage = named(() => import('@/pages/print/AdmitCardPrintPage'), 'AdmitCardPrintPage');
const SeatingPrintPage = named(() => import('@/pages/print/SeatingPrintPage'), 'SeatingPrintPage');

// Pages shared by several portals
const CalendarPage = named(() => import('@/pages/shared/CalendarPage'), 'CalendarPage');
const FamilyLeavePage = named(() => import('@/pages/shared/FamilyLeavePage'), 'FamilyLeavePage');

// Teacher pages
const TeacherDashboard = named(() => import('@/pages/teacher/TeacherDashboard'), 'TeacherDashboard');
const TeacherAttendancePage = named(() => import('@/pages/teacher/TeacherAttendancePage'), 'TeacherAttendancePage');
const TeacherHomeworkPage = named(() => import('@/pages/teacher/TeacherHomeworkPage'), 'TeacherHomeworkPage');
const TeacherExamsPage = named(() => import('@/pages/teacher/TeacherExamsPage'), 'TeacherExamsPage');
const TeacherMarksEntryPage = named(() => import('@/pages/teacher/TeacherMarksEntryPage'), 'TeacherMarksEntryPage');
const TeacherTimetablePage = named(() => import('@/pages/teacher/TeacherTimetablePage'), 'TeacherTimetablePage');
const TeacherNoticesPage = named(() => import('@/pages/teacher/TeacherNoticesPage'), 'TeacherNoticesPage');
const TeacherCommunicationPage = named(() => import('@/pages/teacher/TeacherCommunicationPage'), 'TeacherCommunicationPage');
const TeacherAIAssistantPage = named(() => import('@/pages/teacher/TeacherAIAssistantPage'), 'TeacherAIAssistantPage');
const TeacherStudyMaterialsPage = named(() => import('@/pages/teacher/TeacherStudyMaterialsPage'), 'TeacherStudyMaterialsPage');
const TeacherProfilePage = named(() => import('@/pages/teacher/TeacherProfilePage'), 'TeacherProfilePage');
const TeacherReportCardNotesPage = named(() => import('@/pages/teacher/TeacherReportCardNotesPage'), 'TeacherReportCardNotesPage');
const TeacherMyAttendancePage = named(() => import('@/pages/teacher/TeacherMyAttendancePage'), 'TeacherMyAttendancePage');
const TeacherLeavePage = named(() => import('@/pages/teacher/TeacherLeavePage'), 'TeacherLeavePage');

// Student pages
const StudentDashboard = named(() => import('@/pages/student/StudentDashboard'), 'StudentDashboard');
const StudentSelfAttendancePage = named(() => import('@/pages/student/StudentAttendancePage'), 'StudentAttendancePage');
const StudentFeesPage = named(() => import('@/pages/student/StudentFeesPage'), 'StudentFeesPage');
const StudentSelfHomeworkPage = named(() => import('@/pages/student/StudentHomeworkPage'), 'StudentHomeworkPage');
const StudentSelfExamsPage = named(() => import('@/pages/student/StudentExamsPage'), 'StudentExamsPage');
const StudentSelfNoticesPage = named(() => import('@/pages/student/StudentNoticesPage'), 'StudentNoticesPage');
const StudentSelfCommunicationPage = named(() => import('@/pages/student/StudentCommunicationPage'), 'StudentCommunicationPage');
const StudentReportCardPage = named(() => import('@/pages/student/StudentReportCardPage'), 'StudentReportCardPage');
const StudentProgressPage = named(() => import('@/pages/student/StudentProgressPage'), 'StudentProgressPage');
const StudentSelfAIAssistantPage = named(() => import('@/pages/student/StudentAIAssistantPage'), 'StudentAIAssistantPage');
const StudentSelfStudyMaterialsPage = named(() => import('@/pages/student/StudentStudyMaterialsPage'), 'StudentStudyMaterialsPage');
const StudentSelfProfilePage = named(() => import('@/pages/student/StudentProfilePage'), 'StudentProfilePage');

// Parent pages
const ParentDashboard = named(() => import('@/pages/parent/ParentDashboard'), 'ParentDashboard');
const ParentAttendancePage = named(() => import('@/pages/parent/ParentAttendancePage'), 'ParentAttendancePage');
const ParentResultsPage = named(() => import('@/pages/parent/ParentResultsPage'), 'ParentResultsPage');
const ParentFeesPage = named(() => import('@/pages/parent/ParentFeesPage'), 'ParentFeesPage');
const ParentNoticesPage = named(() => import('@/pages/parent/ParentNoticesPage'), 'ParentNoticesPage');
const ParentCommunicationPage = named(() => import('@/pages/parent/ParentCommunicationPage'), 'ParentCommunicationPage');
const ParentProfilePage = named(() => import('@/pages/parent/ParentProfilePage'), 'ParentProfilePage');
const ParentReportCardPage = named(() => import('@/pages/parent/ParentReportCardPage'), 'ParentReportCardPage');

// Batch-3 pages
const AdmissionsPage = named(() => import('@/pages/admin/AdmissionsPage'), 'AdmissionsPage');
const AdmissionEnquiryPage = named(() => import('@/pages/AdmissionEnquiryPage'), 'AdmissionEnquiryPage');
const TransportPage = named(() => import('@/pages/admin/TransportPage'), 'TransportPage');
const LibraryPage = named(() => import('@/pages/admin/LibraryPage'), 'LibraryPage');
const IdCardsAdminPage = named(() => import('@/pages/admin/IdCardsAdminPage'), 'IdCardsAdminPage');
const PtmOverviewPage = named(() => import('@/pages/admin/PtmOverviewPage'), 'PtmOverviewPage');
const GalleryAdminPage = named(() => import('@/pages/admin/GalleryAdminPage'), 'GalleryAdminPage');
const AtRiskPage = named(() => import('@/pages/admin/AtRiskPage'), 'AtRiskPage');
const WhatsAppPage = named(() => import('@/pages/admin/WhatsAppPage'), 'WhatsAppPage');
const TeacherWhatsAppPage = named(() => import('@/pages/teacher/TeacherWhatsAppPage'), 'TeacherWhatsAppPage');
const TeacherIdCardsPage = named(() => import('@/pages/teacher/TeacherIdCardsPage'), 'TeacherIdCardsPage');
const TeacherPtmPage = named(() => import('@/pages/teacher/TeacherPtmPage'), 'TeacherPtmPage');
const TeacherAtRiskPage = named(() => import('@/pages/teacher/TeacherAtRiskPage'), 'TeacherAtRiskPage');
const TeacherStudentPage = named(() => import('@/pages/teacher/TeacherStudentPage'), 'TeacherStudentPage');
const ParentPtmPage = named(() => import('@/pages/parent/ParentPtmPage'), 'ParentPtmPage');
const MyLibraryPage = named(() => import('@/pages/shared/MyLibraryPage'), 'MyLibraryPage');
const GalleryPage = named(() => import('@/pages/shared/GalleryPage'), 'GalleryPage');
const HealthPage = named(() => import('@/pages/shared/HealthPage'), 'HealthPage');
const MyBusPage = named(() => import('@/pages/shared/MyBusPage'), 'MyBusPage');

/** Renders a lazily loaded page with a loading message while its code downloads. */
const page = (component) => <Suspense fallback={<LoadingMessage />}>{React.createElement(component)}</Suspense>;

const AdminRoute = ({ children }) => <RequireRole role="admin">{children}</RequireRole>;
const lazyAdmin = (Component) => <AdminRoute>{page(Component)}</AdminRoute>;

/** Settings, Logins, Promotion, Backups, Audit: full administrators only (limited staff go to the dashboard). */
const FullAdminGate = ({ children }) => {
  const { currentUser } = useAuth();
  if ((currentUser?.permissions?.length ?? 0) > 0) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  return children;
};
const FullAdminRoute = ({ children }) => (
  <AdminRoute>
    <FullAdminGate>{children}</FullAdminGate>
  </AdminRoute>
);

/** Any signed-in user (pages shared by several roles; the backend decides what each may see). */
const SignedInRoute = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMessage text="Signing you in…" />
      </div>
    );
  }
  if (!currentUser) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  if (currentUser.mustChangePassword) return <ForcedPasswordChange />;
  return children;
};

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
    path: ROUTES.ADMIN_ACCOUNTS,
    element: (
      <FullAdminRoute>
        <AccountsPage />
      </FullAdminRoute>
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
  {
    path: ROUTES.ADMIN_SETTINGS,
    element: (
      <FullAdminRoute>
        <SchoolSettingsPage />
      </FullAdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_PROMOTION,
    element: (
      <FullAdminRoute>
        <PromotionPage />
      </FullAdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_BACKUPS,
    element: (
      <FullAdminRoute>
        <BackupsPage />
      </FullAdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_AUDIT,
    element: (
      <FullAdminRoute>
        <AuditLogPage />
      </FullAdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_CERTIFICATES,
    element: (
      <AdminRoute>
        <CertificatesPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_CALENDAR,
    element: (
      <AdminRoute>
        <CalendarAdminPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_LEAVES,
    element: (
      <AdminRoute>
        <LeaveRequestsPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_STAFF_ATTENDANCE,
    element: (
      <AdminRoute>
        <StaffAttendancePage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_SUBSTITUTIONS,
    element: (
      <AdminRoute>
        <SubstitutionsPage />
      </AdminRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_IMPORT_STUDENTS,
    element: (
      <AdminRoute>
        <ImportStudentsPage />
      </AdminRoute>
    ),
  },
  { path: ROUTES.ADMIN_ADMISSIONS, element: lazyAdmin(AdmissionsPage) },
  { path: ROUTES.ADMIN_TRANSPORT, element: lazyAdmin(TransportPage) },
  { path: ROUTES.ADMIN_LIBRARY, element: lazyAdmin(LibraryPage) },
  { path: ROUTES.ADMIN_ID_CARDS, element: lazyAdmin(IdCardsAdminPage) },
  { path: ROUTES.ADMIN_PTM, element: lazyAdmin(PtmOverviewPage) },
  { path: ROUTES.ADMIN_GALLERY, element: lazyAdmin(GalleryAdminPage) },
  { path: ROUTES.ADMIN_AT_RISK, element: lazyAdmin(AtRiskPage) },
  { path: ROUTES.ADMIN_WHATSAPP, element: lazyAdmin(WhatsAppPage) },

  // PUBLIC: admission enquiry form (no login)
  { path: ROUTES.ADMISSION_ENQUIRY, element: page(AdmissionEnquiryPage) },

  // PRINTABLE PAGES (all roles)
  {
    path: ROUTES.REPORT_CARD_PRINT,
    element: (
      <SignedInRoute>
        <ReportCardPrintPage />
      </SignedInRoute>
    ),
  },
  {
    path: ROUTES.CERTIFICATE_PRINT,
    element: (
      <SignedInRoute>
        <CertificatePrintPage />
      </SignedInRoute>
    ),
  },
  {
    path: ROUTES.ADMIT_CARDS_PRINT,
    element: (
      <SignedInRoute>
        <AdmitCardPrintPage />
      </SignedInRoute>
    ),
  },
  {
    path: ROUTES.EXAM_SEATING_PRINT,
    element: (
      <SignedInRoute>
        <SeatingPrintPage />
      </SignedInRoute>
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
        path: 'report-cards',
        element: <TeacherReportCardNotesPage />,
      },
      {
        path: 'my-attendance',
        element: <TeacherMyAttendancePage />,
      },
      {
        path: 'leave',
        element: <TeacherLeavePage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'profile',
        element: <TeacherProfilePage />,
      },
      { path: 'id-cards', element: page(TeacherIdCardsPage) },
      { path: 'ptm', element: page(TeacherPtmPage) },
      { path: 'gallery', element: page(GalleryPage) },
      { path: 'library', element: page(MyLibraryPage) },
      { path: 'at-risk', element: page(TeacherAtRiskPage) },
      { path: 'whatsapp', element: page(TeacherWhatsAppPage) },
      { path: 'students/:studentId', element: page(TeacherStudentPage) },
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
      {
        path: 'leave',
        element: <FamilyLeavePage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      { path: 'bus', element: page(MyBusPage) },
      { path: 'library', element: page(MyLibraryPage) },
      { path: 'gallery', element: page(GalleryPage) },
      { path: 'health', element: page(HealthPage) },
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
        path: 'report-card',
        element: <ParentReportCardPage />,
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
      {
        path: 'leave',
        element: <FamilyLeavePage />,
      },
      {
        path: 'homework',
        element: <StudentSelfHomeworkPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      { path: 'ptm', element: page(ParentPtmPage) },
      { path: 'bus', element: page(MyBusPage) },
      { path: 'library', element: page(MyLibraryPage) },
      { path: 'gallery', element: page(GalleryPage) },
      { path: 'health', element: page(HealthPage) },
    ],
  },
]);

export const AppRouter = () => {
  // Admin and print pages render their own frame, so while one of them loads a full-page spinner shows.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingMessage />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
};
