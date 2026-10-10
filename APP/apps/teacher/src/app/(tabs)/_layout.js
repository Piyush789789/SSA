import { tabIcon, tabScreenOptions } from '@ssa/shared';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: tabIcon('checkbox-outline') }} />
      <Tabs.Screen name="marks" options={{ title: 'Marks', tabBarIcon: tabIcon('create-outline') }} />
      <Tabs.Screen name="homework" options={{ title: 'Homework', tabBarIcon: tabIcon('book-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('grid-outline') }} />
    </Tabs>
  );
}
