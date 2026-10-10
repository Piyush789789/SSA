import { Badge, Empty, ListItem, Loaded, Screen, SectionTitle, formatDate, todayIso, useApi, useAuth } from '@ssa/shared';
import { router } from 'expo-router';

/** The exam papers this teacher sets: their subjects in their classes. */
export default function Papers() {
  const { profile } = useAuth();
  const state = useApi('/exam-schedules');
  const today = todayIso();

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Loaded state={state}>
        {(papers) => {
          const mine = papers.filter(
            (p) => profile?.subjects.includes(p.subject) && profile?.assignedClasses.includes(p.className),
          );
          const done = mine.filter((p) => p.date <= today).reverse();
          const upcoming = mine.filter((p) => p.date > today);
          return (
            <>
              <SectionTitle>Enter marks</SectionTitle>
              {done.length === 0 ? (
                <Empty text="No exams held yet." icon="document-text-outline" />
              ) : (
                done.map((p) => (
                  <ListItem
                    key={p.id}
                    icon="create-outline"
                    title={`${p.subject} · Class ${p.className}`}
                    subtitle={`${formatDate(p.date)} · Max ${p.maxMarks}`}
                    right={<Badge label={p.status} />}
                    onPress={() => router.push(`/marks/${p.id}`)}
                  />
                ))
              )}
              <SectionTitle>Upcoming</SectionTitle>
              {upcoming.length === 0 ? (
                <Empty text="No upcoming exams." icon="calendar-outline" />
              ) : (
                upcoming.map((p) => (
                  <ListItem
                    key={p.id}
                    icon="time-outline"
                    title={`${p.subject} · Class ${p.className}`}
                    subtitle={`${formatDate(p.date)} · ${p.startTime}–${p.endTime} · Max ${p.maxMarks}`}
                    right={<Badge label="Upcoming" />}
                  />
                ))
              )}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}
