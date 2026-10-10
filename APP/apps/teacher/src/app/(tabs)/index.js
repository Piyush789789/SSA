import {
  AtRiskSummary,
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
  todayIso,
  useApi,
  useAuth,
  useT,
} from '@ssa/shared';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CheckInCard } from '../../staff';

export default function Home() {
  const { profile } = useAuth();
  const t = useT();
  const state = useApi('/dashboard');
  const today = useApi(`/timetable/teacher-day?date=${todayIso()}`);

  return (
    <Screen refreshing={state.refreshing || today.refreshing} onRefresh={() => [state, today].forEach((s) => s.reload())}>
      <Card>
        <Text style={[styles.cardTitle, { fontSize: 20 }]}>{t('Hello')}, {profile?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.muted}>
          {profile?.subjects?.join(', ')} · Classes {profile?.assignedClasses?.join(', ')}
        </Text>
      </Card>
      <CheckInCard />
      <AtRiskSummary />
      <SectionTitle>Today’s schedule</SectionTitle>
      <Loaded state={today}>{(periods) => <TodaySchedule periods={periods} />}</Loaded>
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

/** The teacher's periods today, including classes they cover for absent colleagues. */
function TodaySchedule({ periods }) {
  if (periods.length === 0) {
    return <Empty text="No classes scheduled today." icon="cafe-outline" />;
  }
  return (
    <Card>
      {periods.map((p, i) => (
        <View
          key={`${p.periodId}-${p.className}`}
          style={[styles.row, { alignItems: 'center' }, i === periods.length - 1 && { borderBottomWidth: 0 }]}
        >
          <View style={{ width: 52 }}>
            <Text style={[styles.body, { fontWeight: '700', fontSize: 14 }]}>{p.startTime}</Text>
            <Text style={styles.muted}>{p.endTime}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { fontWeight: '600' }]}>
              {p.subject ?? 'Class'} · {p.className}
            </Text>
            <Text style={styles.muted}>
              {p.label}
              {p.room ? ` · ${p.room}` : ''}
            </Text>
            {p.substitution ? (
              <View style={{ marginTop: 4 }}>
                <Badge label={p.coveringFor ? `Covering for ${p.coveringFor}` : 'Substitution'} tone="warning" />
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}
