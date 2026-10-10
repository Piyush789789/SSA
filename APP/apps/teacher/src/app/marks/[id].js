import {
  Badge,
  Button,
  Card,
  ErrorBox,
  Loaded,
  Screen,
  api,
  colors,
  formatDate,
  styles,
  useApi,
} from '@ssa/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function MarksEntry() {
  const { id } = useLocalSearchParams();
  const state = useApi(`/exam-schedules/${id}/marks`);
  const [entries, setEntries] = useState({}); // studentId -> { text, absent }
  const [saving, setSaving] = useState(null); // 'draft' | 'submit'
  const [error, setError] = useState(null);

  const initialised = useRef(false);
  useEffect(() => {
    if (state.data && !initialised.current) {
      initialised.current = true;
      setEntries(
        Object.fromEntries(
          state.data.rows.map((r) => [r.studentId, { text: r.obtainedMarks == null ? '' : String(r.obtainedMarks), absent: r.absent }]),
        ),
      );
    }
  }, [state.data]);

  const sheet = state.data;
  const max = sheet?.schedule.maxMarks ?? 0;
  const invalid = sheet?.rows.filter((r) => {
    const e = entries[r.studentId];
    if (!e || e.absent || e.text === '') return false;
    const value = Number(e.text);
    return Number.isNaN(value) || value < 0 || value > max;
  }) ?? [];

  function update(studentId, change) {
    setEntries((current) => ({ ...current, [studentId]: { ...current[studentId], ...change } }));
  }

  async function save(submit) {
    if (invalid.length > 0) {
      setError(new Error(`Marks must be between 0 and ${max}. Check ${invalid.map((r) => r.studentName).join(', ')}.`));
      return;
    }
    setSaving(submit ? 'submit' : 'draft');
    setError(null);
    try {
      const body = {
        submit,
        entries: sheet.rows.map((r) => {
          const e = entries[r.studentId] ?? { text: '', absent: false };
          return { studentId: r.studentId, absent: e.absent, obtainedMarks: e.absent || e.text === '' ? null : Number(e.text) };
        }),
      };
      await api(`/exam-schedules/${id}/marks`, { method: 'PUT', body });
      Alert.alert(submit ? 'Marks submitted' : 'Draft saved', 'Your marks have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Save draft" variant="secondary" onPress={() => save(false)} loading={saving === 'draft'} disabled={!sheet} style={{ flex: 1 }} />
          <Button title="Submit" onPress={() => save(true)} loading={saving === 'submit'} disabled={!sheet} style={{ flex: 1 }} />
        </View>
      }
    >
      <Loaded state={state}>
        {(data) => (
          <>
            <Card title={`${data.schedule.subject} · Class ${data.schedule.className}`} right={<Badge label={data.schedule.status} />}>
              <Text style={styles.muted}>
                {data.examName} · {formatDate(data.schedule.date)} · Max {data.schedule.maxMarks} · Pass {data.schedule.passingMarks}
              </Text>
              <Text style={[styles.muted, { marginTop: 4 }]}>Leave a box empty if the marks are not ready yet.</Text>
            </Card>
            {error ? <ErrorBox error={error} /> : null}
            <Card>
              {data.rows.map((row, index) => {
                const e = entries[row.studentId] ?? { text: '', absent: false };
                const bad = invalid.includes(row);
                return (
                  <View key={row.studentId} style={[styles.row, { alignItems: 'center' }, index === data.rows.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.body}>
                        {row.rollNumber}. {row.studentName}
                      </Text>
                      <Text style={styles.muted}>{row.status}</Text>
                    </View>
                    <TextInput
                      value={e.absent ? '' : e.text}
                      onChangeText={(text) => update(row.studentId, { text: text.replace(/[^0-9.]/g, '') })}
                      editable={!e.absent}
                      keyboardType="decimal-pad"
                      placeholder={e.absent ? 'AB' : '—'}
                      placeholderTextColor="#94A3B8"
                      accessibilityLabel={`Marks for ${row.studentName}`}
                      style={[local.input, bad && { borderColor: colors.danger }, e.absent && { backgroundColor: '#F1F5F9' }]}
                    />
                    <Pressable
                      onPress={() => update(row.studentId, { absent: !e.absent })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: e.absent }}
                      accessibilityLabel={`Mark ${row.studentName} absent`}
                      style={[local.absent, e.absent && { backgroundColor: colors.danger, borderColor: colors.danger }]}
                    >
                      <Text style={[local.absentText, e.absent && { color: '#fff' }]}>AB</Text>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </Loaded>
    </Screen>
  );
}

const local = StyleSheet.create({
  input: {
    width: 64,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  absent: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentText: { fontWeight: '700', color: colors.muted, fontSize: 12 },
});
