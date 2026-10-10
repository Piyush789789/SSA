import { notificationBell, tabIcon, tabScreenOptions, useT } from '@ssa/shared';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: t('Home'), tabBarIcon: tabIcon('home-outline'), headerRight: notificationBell }} />
      <Tabs.Screen name="attendance" options={{ title: t('Attendance'), tabBarIcon: tabIcon('calendar-outline') }} />
      <Tabs.Screen name="results" options={{ title: t('Results'), tabBarIcon: tabIcon('ribbon-outline') }} />
      <Tabs.Screen name="fees" options={{ title: t('Fees'), tabBarIcon: tabIcon('wallet-outline') }} />
      <Tabs.Screen name="more" options={{ title: t('More'), tabBarIcon: tabIcon('grid-outline') }} />
    </Tabs>
  );
}
