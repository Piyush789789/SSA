import { createRootLayout } from '@ssa/shared';

import { ChildProvider } from '../child';

export default createRootLayout({
  role: 'PARENT',
  Wrapper: ChildProvider,
  screens: [
    { name: 'homework', title: 'Homework' },
    { name: 'timetable', title: 'Timetable' },
    { name: 'materials', title: 'Study materials' },
    { name: 'notices', title: 'Notices' },
    { name: 'messages', title: 'Messages' },
    { name: 'compose', title: 'New message' },
    { name: 'deposit', title: 'Deposit fee' },
    { name: 'profile', title: 'My profile' },
  ],
});
