import { notificationBell, tabIcon, tabScreenOptions, useT } from '@ssa/shared';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: t('Dashboard'), tabBarIcon: tabIcon('speedometer-outline'), headerRight: notificationBell }} />
      <Tabs.Screen name="students" options={{ title: t('Students'), tabBarIcon: tabIcon('people-outline') }} />
      <Tabs.Screen name="fees" options={{ title: t('Fees'), tabBarIcon: tabIcon('wallet-outline') }} />
      <Tabs.Screen name="exams" options={{ title: t('Exams'), tabBarIcon: tabIcon('document-text-outline') }} />
      <Tabs.Screen name="more" options={{ title: t('More'), tabBarIcon: tabIcon('grid-outline') }} />
    </Tabs>
  );
}
