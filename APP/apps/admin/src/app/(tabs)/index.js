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
  Stat,
  StatGrid,
  formatDate,
  percent,
  rupees,
  useApi,
} from '@ssa/shared';
import { router } from 'expo-router';

export default function Dashboard() {
  const state = useApi('/dashboard');

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Loaded state={state}>
        {(d) => (
          <>
            <StatGrid>
              <Stat label="Students" value={d.totalStudents} icon="people-outline" tone="primary" />
              <Stat label="Teachers" value={d.totalTeachers} icon="easel-outline" tone="info" />
              <Stat label="Classes" value={d.totalClasses} icon="business-outline" />
              <Stat label="Attendance today" value={percent(d.todayAttendance.rate)} icon="calendar-outline" tone="success" />
            </StatGrid>

            <Card
              title="Attendance today"
              right={d.todayAttendance.notMarked > 0 ? <Badge label={`${d.todayAttendance.notMarked} not marked`} tone="warning" /> : null}
              onPress={() => router.push('/attendance-summary')}
            >
              <Row label="Present" value={d.todayAttendance.present} />
              <Row label="Late" value={d.todayAttendance.late} />
              <Row label="Absent" value={d.todayAttendance.absent} />
              <Row label="On leave" value={d.todayAttendance.leave} last />
            </Card>

            {d.depositsToVerify > 0 ? (
              <ListItem
                icon="card-outline"
                title={`${d.depositsToVerify} fee deposit${d.depositsToVerify === 1 ? '' : 's'} to verify`}
                subtitle="Families reported payments from the app"
                right={<Badge label="Action" tone="warning" />}
                onPress={() => router.navigate('/fees')}
              />
            ) : null}

            <Card title="Fees" onPress={() => router.navigate('/fees')}>
              <Row label="Collected today" value={`${rupees(d.fees.collectedToday)} (${d.fees.paymentsToday} payments)`} />
              <Row label="Collected this year" value={rupees(d.fees.collected)} />
              <Row label="Pending" value={rupees(d.fees.pending)} />
              <Row label="Overdue" value={rupees(d.fees.overdue)} last />
            </Card>

            <AtRiskSummary />

            <SectionTitle>Low attendance (below 75%)</SectionTitle>
            {d.lowAttendance.length === 0 ? (
              <Empty text="Every student is above 75%." icon="happy-outline" />
            ) : (
              d.lowAttendance.map((s) => (
                <ListItem
                  key={s.studentId}
                  icon="alert-circle-outline"
                  title={s.name}
                  subtitle={`Class ${s.className}`}
                  right={<Badge label={percent(s.rate)} tone="danger" />}
                  onPress={() => router.push(`/student/${s.studentId}`)}
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
          </>
        )}
      </Loaded>
    </Screen>
  );
}
