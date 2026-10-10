import { tabIcon, tabScreenOptions } from '@ssa/shared';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: tabIcon('calendar-outline') }} />
      <Tabs.Screen name="results" options={{ title: 'Results', tabBarIcon: tabIcon('ribbon-outline') }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarIcon: tabIcon('wallet-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('grid-outline') }} />
    </Tabs>
  );
}
