import {
  Button,
  Card,
  Chips,
  ErrorBox,
  Loaded,
  Screen,
  SectionTitle,
  api,
  colors,
  combine,
  daysAgoIso,
  formatDate,
  styles,
  todayIso,
  tones,
  useApi,
  useAuth,
} from '@ssa/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const STATUSES = [
  { value: 'present', label: 'P', tone: 'success' },
  { value: 'absent', label: 'A', tone: 'danger' },
  { value: 'late', label: 'L', tone: 'warning' },
  { value: 'leave', label: 'Lv', tone: 'info' },
];

export default function MarkAttendance() {
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  const classes = profile?.assignedClasses ?? [];
  const [className, setClassName] = useState(params.className ?? classes[0]);
  const [date, setDate] = useState(todayIso());
  const [marks, setMarks] = useState({}); // studentId -> status
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // The dashboard opens this tab with ?className=...
  useEffect(() => {
    if (params.className) setClassName(params.className);
  }, [params.className]);

  const roster = useApi(className ? `/classes/${className}/students` : null);
  const records = useApi(className ? `/attendance?className=${className}&date=${date}` : null);
  const state = combine(roster, records);

  // Start from what is already saved for this class and day; keep unsaved edits when the tab refocuses.
  const key = `${className}|${date}`;
  const initialisedFor = useRef(null);
  useEffect(() => {
    if (records.data && initialisedFor.current !== key) {
      initialisedFor.current = key;
      setMarks(Object.fromEntries(records.data.map((r) => [r.studentId, r.status])));
      setMessage(null);
      setError(null);
    }
  }, [records.data, key]);

  const students = roster.data ?? [];
  const unmarked = students.filter((s) => !marks[s.id]).length;

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const entries = students.filter((s) => marks[s.id]).map((s) => ({ studentId: s.id, status: marks[s.id] }));
      await api('/attendance', { method: 'PUT', body: { className, date, entries } });
      setMessage(`Attendance saved for ${entries.length} students.`);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={
        <Button
          title={unmarked > 0 ? `Save (${unmarked} not marked)` : 'Save attendance'}
          icon="save-outline"
          onPress={save}
          loading={saving}
          disabled={students.length === 0 || unmarked === students.length}
        />
      }
    >
      <SectionTitle>Class</SectionTitle>
      <Chips options={classes.map((c) => ({ label: c, value: c }))} value={className} onChange={setClassName} />
      <SectionTitle>Date</SectionTitle>
      <Chips
        options={[
          { label: 'Today', value: todayIso() },
          { label: 'Yesterday', value: daysAgoIso(1) },
          { label: formatDate(daysAgoIso(2)), value: daysAgoIso(2) },
        ]}
        value={date}
        onChange={setDate}
      />

      {message ? (
        <Card style={{ backgroundColor: colors.successSoft, borderColor: '#A7F3D0' }}>
          <Text style={[styles.body, { color: colors.success }]}>{message}</Text>
        </Card>
      ) : null}
      {error ? <ErrorBox error={error} /> : null}

      <Loaded state={state}>
        {() => (
          <>
            <Button
              title="Mark everyone present"
              variant="secondary"
              icon="checkmark-done-outline"
              onPress={() => setMarks(Object.fromEntries(students.map((s) => [s.id, 'present'])))}
              style={{ marginBottom: 12 }}
            />
            <Card>
              {students.map((student, index) => (
                <View key={student.id} style={[styles.row, { alignItems: 'center' }, index === students.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.body}>{student.name}</Text>
                    <Text style={styles.muted}>Roll {student.rollNumber}</Text>
                  </View>
                  <View style={local.statusRow}>
                    {STATUSES.map((status) => {
                      const selected = marks[student.id] === status.value;
                      const tone = tones[status.tone];
                      return (
                        <Pressable
                          key={status.value}
                          onPress={() => setMarks((m) => ({ ...m, [student.id]: status.value }))}
                          accessibilityRole="button"
                          accessibilityLabel={`${student.name}: ${status.value}`}
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
          </>
        )}
      </Loaded>
    </Screen>
  );
}

const local = StyleSheet.create({
  statusRow: { flexDirection: 'row', gap: 6 },
  status: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  statusText: { fontWeight: '700', color: colors.muted, fontSize: 13 },
});
