import { ListItem, Screen } from '@ssa/shared';
import { router } from 'expo-router';

const LINKS = [
  { route: '/homework', title: 'Homework', icon: 'book-outline' },
  { route: '/timetable', title: 'Timetable', icon: 'time-outline' },
  { route: '/calendar', title: 'Holidays & events', icon: 'calendar-number-outline' },
  { route: '/leave', title: 'Apply for leave', icon: 'airplane-outline' },
  { route: '/admit-card', title: 'Admit card', icon: 'id-card-outline' },
  { route: '/materials', title: 'Study materials', icon: 'folder-open-outline' },
  { route: '/bus', title: 'My bus', icon: 'bus-outline' },
  { route: '/id-card', title: 'ID card', icon: 'card-outline' },
  { route: '/library', title: 'Library', icon: 'library-outline' },
  { route: '/health', title: 'Health', icon: 'medkit-outline' },
  { route: '/gallery', title: 'Gallery', icon: 'images-outline' },
  { route: '/report-card', title: 'Report card', icon: 'school-outline' },
  { route: '/certificates', title: 'Certificates', icon: 'document-text-outline' },
  { route: '/notices', title: 'Notices', icon: 'megaphone-outline' },
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
