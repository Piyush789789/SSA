import { Badge, Card, Loaded, Screen, formatDate, percent, styles, todayIso, useApi } from '@ssa/shared';
import { Text } from 'react-native';

export default function AttendanceSummary() {
  const today = todayIso();
  const state = useApi(`/attendance/summary?date=${today}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Text style={[styles.muted, { marginBottom: 12 }]}>{formatDate(today)}</Text>
      <Loaded state={state}>
        {(classes) =>
          classes.map((c) => (
            <Card
              key={c.className}
              title={`Class ${c.className}`}
              right={
                c.notMarked === c.totalStudents ? (
                  <Badge label="Not marked" tone="danger" />
                ) : (
                  <Badge label={percent(c.rate)} />
                )
              }
            >
              <Text style={styles.muted}>
                {c.totalStudents} students · Present {c.present} · Late {c.late} · Absent {c.absent} · Leave {c.leave}
                {c.notMarked > 0 && c.notMarked < c.totalStudents ? ` · ${c.notMarked} not marked` : ''}
              </Text>
            </Card>
          ))
        }
      </Loaded>
    </Screen>
  );
}
