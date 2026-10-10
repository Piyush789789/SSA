import { ListItem, Screen } from '@ssa/shared';
import { router } from 'expo-router';

const LINKS = [
  { route: '/my-attendance', title: 'My attendance', icon: 'finger-print-outline' },
  { route: '/my-leave', title: 'My leave', icon: 'airplane-outline' },
  { route: '/leave-requests', title: 'Student leave requests', icon: 'mail-unread-outline' },
  { route: '/timetable', title: 'My timetable', icon: 'time-outline' },
  { route: '/calendar', title: 'Holidays & events', icon: 'calendar-number-outline' },
  { route: '/report-notes', title: 'Report card notes', icon: 'school-outline' },
  { route: '/ptm', title: 'PTM', icon: 'people-outline' },
  { route: '/at-risk', title: 'Students needing attention', icon: 'alert-circle-outline' },
  { route: '/sick-visit', title: 'Record sick-room visit', icon: 'medkit-outline' },
  { route: '/library', title: 'Library', icon: 'library-outline' },
  { route: '/gallery', title: 'Gallery', icon: 'images-outline' },
  { route: '/notices', title: 'Notices', icon: 'megaphone-outline' },
  { route: '/notice-new', title: 'Post a notice', icon: 'add-circle-outline' },
  { route: '/messages', title: 'Messages', icon: 'chatbubbles-outline' },
  { route: '/notifications', title: 'Notifications', icon: 'notifications-outline' },
  { route: '/profile', title: 'My profile', icon: 'person-circle-outline' },
];

export default function More() {
  return (
    <Screen>
      {LINKS.map((link) => (
        <ListItem key={link.route} title={link.title} icon={link.icon} onPress={() => router.push(link.route)} />
      ))}
    </Screen>
  );
}
