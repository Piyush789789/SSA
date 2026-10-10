import { Button, Empty, HomeworkCard, Loaded, Screen, todayIso, useApi, useAuth } from '@ssa/shared';
import { router } from 'expo-router';

/** Homework this teacher has assigned. Tap an item to check submissions (or delete it). */
export default function Homework() {
  const { profile } = useAuth();
  const state = useApi('/homework');
  const today = todayIso();

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
            mine.map((hw) => (
              <HomeworkCard
                key={hw.id}
                homework={hw}
                today={today}
                onPress={() => router.push({ pathname: '/homework-review', params: { homeworkId: hw.id } })}
              />
            ))
          );
        }}
      </Loaded>
    </Screen>
  );
}
