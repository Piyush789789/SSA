import { notificationBell, tabIcon, tabScreenOptions, useT } from '@ssa/shared';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: t('Home'), tabBarIcon: tabIcon('home-outline'), headerRight: notificationBell }} />
      <Tabs.Screen name="attendance" options={{ title: t('Attendance'), tabBarIcon: tabIcon('checkbox-outline') }} />
      <Tabs.Screen name="marks" options={{ title: t('Marks'), tabBarIcon: tabIcon('create-outline') }} />
      <Tabs.Screen name="homework" options={{ title: t('Homework'), tabBarIcon: tabIcon('book-outline') }} />
      <Tabs.Screen name="more" options={{ title: t('More'), tabBarIcon: tabIcon('grid-outline') }} />
    </Tabs>
  );
}
