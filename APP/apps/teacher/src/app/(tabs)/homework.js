import { Button, Empty, HomeworkCard, Loaded, Screen, api, todayIso, useApi, useAuth } from '@ssa/shared';
import { router } from 'expo-router';
import { Alert } from 'react-native';

/** Homework this teacher has assigned. Tap an item to delete it. */
export default function Homework() {
  const { profile } = useAuth();
  const state = useApi('/homework');
  const today = todayIso();

  function confirmDelete(hw) {
    Alert.alert('Delete homework', `Delete "${hw.title}" for class ${hw.className}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/homework/${hw.id}`, { method: 'DELETE' });
            state.reload();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  }

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={<Button title="Assign homework" icon="add-circle-outline" onPress={() => router.push('/homework-new')} />}
    >
      <Loaded state={state}>
        {(list) => {
          const mine = list.filter((hw) => hw.teacherId === profile?.id);
          return mine.length === 0 ? (
            <Empty text="You have not assigned any homework." icon="book-outline" />
          ) : (
            mine.map((hw) => <HomeworkCard key={hw.id} homework={hw} today={today} onPress={() => confirmDelete(hw)} />)
          );
        }}
      </Loaded>
    </Screen>
  );
}
