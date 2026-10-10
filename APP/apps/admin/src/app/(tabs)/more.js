import { ListItem, Screen } from '@ssa/shared';
import { router } from 'expo-router';

const LINKS = [
  { route: '/attendance-summary', title: 'Attendance today', icon: 'calendar-outline' },
  { route: '/staff-attendance', title: 'Staff attendance', icon: 'finger-print-outline' },
  { route: '/leave-requests', title: 'Leave requests', icon: 'airplane-outline' },
  { route: '/substitutions', title: 'Substitutions', icon: 'swap-horizontal-outline' },
  { route: '/calendar', title: 'Holidays & events', icon: 'calendar-number-outline' },
  { route: '/admissions', title: 'Admission enquiries', icon: 'person-add-outline' },
  { route: '/at-risk', title: 'Students needing attention', icon: 'alert-circle-outline' },
  { route: '/library', title: 'Library loans', icon: 'library-outline' },
  { route: '/ptm', title: 'PTM overview', icon: 'people-outline' },
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
