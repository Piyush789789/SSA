import { ListItem, Screen } from '@ssa/shared';
import { router } from 'expo-router';

const LINKS = [
  { route: '/homework', title: 'Homework', icon: 'book-outline' },
  { route: '/timetable', title: 'Timetable', icon: 'time-outline' },
  { route: '/materials', title: 'Study materials', icon: 'folder-open-outline' },
  { route: '/notices', title: 'Notices', icon: 'megaphone-outline' },
  { route: '/messages', title: 'Messages', icon: 'chatbubbles-outline' },
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
