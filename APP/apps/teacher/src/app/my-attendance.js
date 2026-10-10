import { Badge, Card, Empty, Loaded, Screen, SectionTitle, daysAgoIso, formatDate, styles, todayIso, useApi, weekdayOf } from '@ssa/shared';
import { Text, View } from 'react-native';

import { CheckInCard, staffStatusLabel, staffStatusTone } from '../staff';

const DAYS = 30;

/** Today's check in / out, and the teacher's own attendance for the last 30 days. */
export default function MyAttendance() {
  const from = daysAgoIso(DAYS - 1);
  const state = useApi(`/staff-attendance/records?from=${from}&to=${todayIso()}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <CheckInCard />
      <SectionTitle>Last {DAYS} days</SectionTitle>
      <Loaded state={state}>
        {(records) => {
          const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
          const count = (status) => records.filter((r) => r.status === status).length;
          return sorted.length === 0 ? (
            <Empty text="No attendance recorded in the last 30 days." icon="calendar-outline" />
          ) : (
            <>
              <Text style={[styles.muted, { marginBottom: 10 }]}>
                Present {count('PRESENT')} · Half day {count('HALF_DAY')} · Leave {count('LEAVE')} · Absent {count('ABSENT')}
              </Text>
              <Card>
                {sorted.map((r, i) => (
                  <View key={r.date} style={[styles.row, { alignItems: 'center' }, i === sorted.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.body}>
                        {weekdayOf(r.date).slice(0, 3)}, {formatDate(r.date)}
                      </Text>
                      <Text style={styles.muted}>
                        In {r.checkIn ?? '—'} · Out {r.checkOut ?? '—'}
                        {r.markedBy ? ` · by ${r.markedBy}` : ''}
                      </Text>
                    </View>
                    <Badge label={staffStatusLabel(r.status)} tone={staffStatusTone(r.status)} />
                  </View>
                ))}
              </Card>
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}
