import {
  Badge,
  Card,
  Empty,
  ListItem,
  Loaded,
  Row,
  Screen,
  SectionTitle,
  formatDate,
  percent,
  styles,
  useApi,
  useAuth,
} from '@ssa/shared';
import { router } from 'expo-router';
import { Text } from 'react-native';

export default function Home() {
  const { profile } = useAuth();
  const state = useApi('/dashboard');

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Card>
        <Text style={[styles.cardTitle, { fontSize: 20 }]}>Hello, {profile?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.muted}>
          {profile?.subjects?.join(', ')} · Classes {profile?.assignedClasses?.join(', ')}
        </Text>
      </Card>
      <Loaded state={state}>
        {(d) => (
          <>
            <SectionTitle>Today’s attendance</SectionTitle>
            {d.classes.map((c) => (
              <Card
                key={c.className}
                title={`Class ${c.className}`}
                right={
                  c.notMarked === c.totalStudents ? (
                    <Badge label="Not marked" tone="danger" />
                  ) : (
                    <Badge label={percent(c.rate)} tone="success" />
                  )
                }
                onPress={() => router.navigate({ pathname: '/attendance', params: { className: c.className } })}
              >
                <Text style={styles.muted}>
                  Present {c.present + c.late} of {c.totalStudents} · Absent {c.absent} · Leave {c.leave}
                  {c.notMarked > 0 && c.notMarked < c.totalStudents ? ` · ${c.notMarked} not marked` : ''}
                </Text>
              </Card>
            ))}

            <SectionTitle>Today’s classes</SectionTitle>
            {d.todaysTimetable.length === 0 ? (
              <Empty text="No classes scheduled today." icon="cafe-outline" />
            ) : (
              <Card>
                {d.todaysTimetable.map((e, i) => (
                  <Row
                    key={e.id}
                    label={e.periodId.replace('period-', 'Period ')}
                    value={`${e.subject} · ${e.className} · ${e.room}`}
                    last={i === d.todaysTimetable.length - 1}
                  />
                ))}
              </Card>
            )}

            <SectionTitle>Marks to enter</SectionTitle>
            {d.pendingMarksEntry.length === 0 ? (
              <Empty text="All marks are entered." icon="checkmark-done-outline" />
            ) : (
              d.pendingMarksEntry.map((p) => (
                <ListItem
                  key={p.scheduleId}
                  icon="create-outline"
                  title={`${p.subject} · Class ${p.className}`}
                  subtitle={`${p.examName} · ${p.entered}/${p.totalStudents} entered`}
                  onPress={() => router.push(`/marks/${p.scheduleId}`)}
                />
              ))
            )}

            <SectionTitle>Upcoming exams</SectionTitle>
            {d.upcomingExams.length === 0 ? (
              <Empty text="No exams scheduled." icon="document-text-outline" />
            ) : (
              <Card>
                {d.upcomingExams.map((p, i) => (
                  <Row
                    key={p.scheduleId}
                    label={`${p.subject} · ${p.className}`}
                    value={formatDate(p.date)}
                    last={i === d.upcomingExams.length - 1}
                  />
                ))}
              </Card>
            )}

            <SectionTitle>Low attendance (below 75%)</SectionTitle>
            {d.lowAttendance.length === 0 ? (
              <Empty text="Everyone is above 75%." icon="happy-outline" />
            ) : (
              <Card>
                {d.lowAttendance.map((s, i) => (
                  <Row
                    key={s.studentId}
                    label={`${s.name} (${s.className})`}
                    value={percent(s.rate)}
                    last={i === d.lowAttendance.length - 1}
                  />
                ))}
              </Card>
            )}
          </>
        )}
      </Loaded>
    </Screen>
  );
}
