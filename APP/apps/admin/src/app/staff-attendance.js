import {
  Badge,
  Button,
  Card,
  Chips,
  DateStepper,
  Empty,
  ErrorBox,
  InfoCard,
  Loaded,
  Screen,
  api,
  colors,
  combine,
  percent,
  styles,
  todayIso,
  tones,
  useApi,
} from '@ssa/shared';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const STATUSES = [
  { value: 'PRESENT', label: 'P', tone: 'success' },
  { value: 'ABSENT', label: 'A', tone: 'danger' },
  { value: 'HALF_DAY', label: '½', tone: 'warning' },
  { value: 'LEAVE', label: 'Lv', tone: 'info' },
];

/** Daily staff attendance sheet (with "Mark all present") and this month's report. */
export default function StaffAttendance() {
  const [tab, setTab] = useState('sheet');
  const tabs = <Tabs value={tab} onChange={setTab} />;
  return tab === 'sheet' ? <DailySheet tabs={tabs} /> : <MonthReport tabs={tabs} />;
}

function Tabs({ value, onChange }) {
  return (
    <Chips
      options={[
        { label: 'Daily sheet', value: 'sheet' },
        { label: 'This month', value: 'report' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

function DailySheet({ tabs }) {
  const today = todayIso();
  const [date, setDate] = useState(today);
  const sheet = useApi(`/staff-attendance?date=${date}`);
  const dayCheck = useApi(`/calendar/check?date=${date}`);
  const state = combine(sheet, dayCheck);
  const [marks, setMarks] = useState({}); // teacherId -> status
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Start from what is saved (or approved leave / present); keep unsaved edits when the screen refocuses.
  const initialisedFor = useRef(null);
  useEffect(() => {
    if (sheet.data && initialisedFor.current !== date) {
      initialisedFor.current = date;
      setMarks(Object.fromEntries(sheet.data.map((row) => [row.teacherId, defaultStatus(row)])));
      setMessage(null);
      setError(null);
    }
  }, [sheet.data, date]);

  const rows = sheet.data ?? [];
  const holiday = dayCheck.data?.holiday ? dayCheck.data : null;

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const entries = rows.map((row) => ({
        teacherId: row.teacherId,
        status: marks[row.teacherId] ?? defaultStatus(row),
        checkIn: row.record?.checkIn ?? null,
        checkOut: row.record?.checkOut ?? null,
      }));
      await api('/staff-attendance', { method: 'PUT', body: { date, entries } });
      setMessage(`Staff attendance saved for ${entries.length} teachers.`);
      sheet.reload();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  function markAllPresent() {
    setMarks(Object.fromEntries(rows.map((row) => [row.teacherId, row.approvedLeaveId ? 'LEAVE' : 'PRESENT'])));
  }

  const counts = STATUSES.map((s) => `${s.label} ${rows.filter((r) => marks[r.teacherId] === s.value).length}`).join(' · ');

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={
        <Button title="Save staff attendance" icon="save-outline" onPress={save} loading={saving} disabled={rows.length === 0 || !!holiday} />
      }
    >
      {tabs}
      <DateStepper value={date} onChange={setDate} max={today} />
      {message ? <InfoCard text={message} /> : null}
      {error ? <ErrorBox error={error} /> : null}
      <Loaded state={state}>
        {() =>
          holiday ? (
            <Card title="Holiday — no attendance" right={<Badge label="Holiday" tone="neutral" />}>
              <Text style={styles.muted}>{holiday.title || 'This day is a holiday'}.</Text>
            </Card>
          ) : rows.length === 0 ? (
            <Empty text="No teachers found." icon="people-outline" />
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
                <Text style={[styles.muted, { flex: 1 }]}>{counts}</Text>
                <Button title="Mark all present" variant="secondary" icon="checkmark-done-outline" onPress={markAllPresent} style={{ paddingVertical: 8 }} />
              </View>
              <Card>
                {rows.map((row, index) => (
                  <View key={row.teacherId} style={[styles.row, { alignItems: 'center' }, index === rows.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.body}>{row.teacherName}</Text>
                      <Text style={styles.muted} numberOfLines={1}>
                        {row.record?.checkIn ? `In ${row.record.checkIn}` : 'Not checked in'}
                        {row.record?.checkOut ? ` · Out ${row.record.checkOut}` : ''}
                        {row.approvedLeaveId ? ' · On approved leave' : ''}
                      </Text>
                    </View>
                    <View style={local.statusRow}>
                      {STATUSES.map((status) => {
                        const selected = marks[row.teacherId] === status.value;
                        const tone = tones[status.tone];
                        return (
                          <Pressable
                            key={status.value}
                            onPress={() => setMarks((m) => ({ ...m, [row.teacherId]: status.value }))}
                            accessibilityRole="button"
                            accessibilityLabel={`${row.teacherName}: ${status.value.toLowerCase().replace('_', ' ')}`}
                            accessibilityState={{ selected }}
                            style={[local.status, selected && { backgroundColor: tone.fg, borderColor: tone.fg }]}
                          >
                            <Text style={[local.statusText, selected && { color: '#fff' }]}>{status.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </Card>
              <Text style={[styles.muted, styles.small]}>P present · A absent · ½ half day · Lv leave</Text>
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}

function MonthReport({ tabs }) {
  const state = useApi('/staff-attendance/report');
  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {tabs}
      <Loaded state={state}>
        {(rows) =>
          rows.length === 0 ? (
            <Empty text="No staff attendance this month." icon="stats-chart-outline" />
          ) : (
            rows.map((r) => (
              <Card key={r.teacherId} title={r.teacherName} right={<Badge label={percent(r.rate)} tone={rateTone(r.rate)} />}>
                <Text style={styles.muted}>
                  {r.workingDays} working days · Present {r.present} · Half day {r.halfDay} · Leave {r.leave} · Absent {r.absent}
                </Text>
              </Card>
            ))
          )
        }
      </Loaded>
    </Screen>
  );
}

function rateTone(rate) {
  if (rate == null) return 'neutral';
  if (rate >= 90) return 'success';
  return rate >= 75 ? 'warning' : 'danger';
}

function defaultStatus(row) {
  return row.record?.status ?? (row.approvedLeaveId ? 'LEAVE' : 'PRESENT');
}

const local = StyleSheet.create({
  statusRow: { flexDirection: 'row', gap: 6 },
  status: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  statusText: { fontWeight: '700', color: colors.muted, fontSize: 13 },
});
