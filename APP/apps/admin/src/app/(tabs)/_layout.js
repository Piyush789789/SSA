import { tabIcon, tabScreenOptions } from '@ssa/shared';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('speedometer-outline') }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: tabIcon('people-outline') }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarIcon: tabIcon('wallet-outline') }} />
      <Tabs.Screen name="exams" options={{ title: 'Exams', tabBarIcon: tabIcon('document-text-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('grid-outline') }} />
    </Tabs>
  );
}
