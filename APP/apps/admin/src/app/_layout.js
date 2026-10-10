import { createRootLayout } from '@ssa/shared';

export default createRootLayout({
  role: 'ADMIN',
  screens: [
    { name: 'student/[id]', title: 'Student' },
    { name: 'collect/[id]', title: 'Collect payment' },
    { name: 'attendance-summary', title: 'Attendance today' },
    { name: 'notices', title: 'Notices' },
    { name: 'notice-new', title: 'Post a notice' },
    { name: 'messages', title: 'Messages' },
    { name: 'compose', title: 'New message' },
    { name: 'profile', title: 'My profile' },
  ],
});
