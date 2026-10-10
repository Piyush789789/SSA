import { createRootLayout } from '@ssa/shared';

export default createRootLayout({
  role: 'TEACHER',
  screens: [
    { name: 'marks/[id]', title: 'Enter marks' },
    { name: 'homework-new', title: 'New homework' },
    { name: 'timetable', title: 'My timetable' },
    { name: 'notices', title: 'Notices' },
    { name: 'notice-new', title: 'Post a notice' },
    { name: 'messages', title: 'Messages' },
    { name: 'compose', title: 'New message' },
    { name: 'profile', title: 'My profile' },
  ],
});
