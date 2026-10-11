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
  useT,
} from '@ssa/shared';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/** Keeps digits and a decimal point only. */
const cleanNumber = (text) => text.replace(/[^0-9.]/g, '');
const round2 = (value) => Math.round(value * 100) / 100;
const outOfRange = (text, max) => {
  if (text === '') return false;
  const value = Number(text);
  return Number.isNaN(value) || value < 0 || value > max;
};
/** Identifies a paper's question set, so the entries are rebuilt when the questions change. */
const questionsKey = (questions) => JSON.stringify((questions ?? []).map((q) => [q.label, q.maxMarks]));

function entryOf(row, questions) {
  const marks = row.questionMarks?.length === questions.length ? row.questionMarks : null;
  return {
    text: row.obtainedMarks == null ? '' : String(row.obtainedMarks),
    absent: row.absent,
    q: questions.map((_, i) => (marks?.[i] == null ? '' : String(marks[i]))),
  };
}

export default function MarksEntry() {
  const { id } = useLocalSearchParams();
  const t = useT();
  const state = useApi(`/exam-schedules/${id}/marks`);
  const [entries, setEntries] = useState({}); // studentId -> { text, absent, q: [text per question] }
  const [saving, setSaving] = useState(null); // 'draft' | 'submit'
  const [error, setError] = useState(null);

  // Built once, and again when the paper's questions change (the screen reloads on focus; typed marks must survive).
  const initialisedFor = useRef(null);
  useEffect(() => {
    if (!state.data) return;
    const key = questionsKey(state.data.schedule.questions);
    if (initialisedFor.current === key) return;
    const firstLoad = initialisedFor.current == null;
    initialisedFor.current = key;
    const questions = state.data.schedule.questions ?? [];
    setEntries((current) =>
      Object.fromEntries(
        state.data.rows.map((r) => {
          const fresh = entryOf(r, questions);
          const kept = firstLoad ? null : current[r.studentId];
          return [r.studentId, kept ? { ...fresh, text: kept.text, absent: kept.absent } : fresh];
        }),
      ),
    );
  }, [state.data]);

  const sheet = state.data;
  const max = sheet?.schedule.maxMarks ?? 0;
  const questions = sheet?.schedule.questions ?? [];
  const byQuestion = questions.length > 0;

  /** Question indexes out of range for one entry (question papers), or [-1] for a bad total. */
  function badInputs(e) {
    if (!e || e.absent) return [];
    if (byQuestion) return questions.flatMap((q, i) => (outOfRange(e.q?.[i] ?? '', q.maxMarks) ? [i] : []));
    return outOfRange(e.text, max) ? [-1] : [];
  }
  const invalid = sheet?.rows.filter((r) => badInputs(entries[r.studentId]).length > 0) ?? [];

  function update(studentId, change) {
    setEntries((current) => ({ ...current, [studentId]: { ...current[studentId], ...change } }));
  }

  function updateQuestion(studentId, index, text) {
    setEntries((current) => {
      const e = current[studentId];
      const q = [...(e?.q ?? questions.map(() => ''))];
      q[index] = cleanNumber(text);
      return { ...current, [studentId]: { ...e, q } };
    });
  }

  /** The sum of the entered question marks, or null when none is entered. */
  function questionTotal(e) {
    const values = (e?.q ?? []).filter((text) => text !== '').map(Number);
    return values.length === 0 ? null : round2(values.reduce((a, b) => a + b, 0));
  }

  function entryBody(r) {
    const e = entries[r.studentId] ?? { text: '', absent: false, q: [] };
    const total = e.absent || e.text === '' ? null : Number(e.text);
    if (!byQuestion || e.absent) return { studentId: r.studentId, absent: e.absent, obtainedMarks: total };
    const questionMarks = questions.map((_, i) => (e.q?.[i] ? Number(e.q[i]) : null));
    if (questionMarks.every((v) => v == null)) {
      // No question marks typed: keep a total-only entry as it was.
      return { studentId: r.studentId, absent: false, obtainedMarks: total };
    }
    return { studentId: r.studentId, absent: false, obtainedMarks: questionTotal(e), questionMarks };
  }

  async function save(submit) {
    if (invalid.length > 0) {
      setError(
        new Error(
          byQuestion
            ? `Each question's marks must be between 0 and its maximum. Check ${invalid.map((r) => r.studentName).join(', ')}.`
            : `Marks must be between 0 and ${max}. Check ${invalid.map((r) => r.studentName).join(', ')}.`,
        ),
      );
      return;
    }
    setSaving(submit ? 'submit' : 'draft');
    setError(null);
    try {
      const body = { submit, entries: sheet.rows.map(entryBody) };
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
              <Text style={[styles.muted, { marginTop: 4 }]}>
                {t(
                  byQuestion
                    ? 'Enter marks for each question. Leave a question empty if it was not attempted.'
                    : 'Leave a box empty if the marks are not ready yet.',
                )}
              </Text>
            </Card>
            <QuestionsEditor key={questionsKey(data.schedule.questions)} schedule={data.schedule} onSaved={state.reload} />
            {invalid.length > 0 ? (
              <Text style={[styles.small, { color: colors.danger, marginBottom: 12 }]}>
                {t('Fix the marks in red before saving.')}
              </Text>
            ) : null}
            {error ? <ErrorBox error={error} /> : null}
            <Card>
              {data.rows.map((row, index) => {
                const e = entries[row.studentId] ?? { text: '', absent: false, q: [] };
                const bad = badInputs(e);
                const last = index === data.rows.length - 1 && { borderBottomWidth: 0 };
                const absentToggle = (
                  <Pressable
                    onPress={() => update(row.studentId, { absent: !e.absent })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: e.absent }}
                    accessibilityLabel={`Mark ${row.studentName} absent`}
                    style={[local.absent, e.absent && { backgroundColor: colors.danger, borderColor: colors.danger }]}
                  >
                    <Text style={[local.absentText, e.absent && { color: '#fff' }]}>AB</Text>
                  </Pressable>
                );
                const student = (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.body}>
                      {row.rollNumber}. {row.studentName}
                    </Text>
                    <Text style={styles.muted}>{row.status}</Text>
                  </View>
                );

                if (byQuestion) {
                  const sum = questionTotal(e);
                  const totalOnly = sum == null && e.text !== '';
                  return (
                    <View key={row.studentId} style={[local.studentBlock, last]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {student}
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={local.totalLabel}>{t('Total')}</Text>
                          <Text style={[local.totalValue, bad.length > 0 && { color: colors.danger }]}>
                            {e.absent ? 'AB' : `${sum ?? (totalOnly ? e.text : '—')} / ${max}`}
                          </Text>
                        </View>
                        {absentToggle}
                      </View>
                      {e.absent ? null : (
                        <>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
                            {questions.map((q, i) => (
                              <View key={q.label} style={{ alignItems: 'center' }}>
                                <Text style={local.questionLabel}>
                                  {q.label} <Text style={{ color: colors.muted }}>/{q.maxMarks}</Text>
                                </Text>
                                <TextInput
                                  value={e.q?.[i] ?? ''}
                                  onChangeText={(text) => updateQuestion(row.studentId, i, text)}
                                  keyboardType="decimal-pad"
                                  placeholder="—"
                                  placeholderTextColor="#94A3B8"
                                  accessibilityLabel={`${q.label} marks for ${row.studentName}, out of ${q.maxMarks}`}
                                  style={[local.questionInput, bad.includes(i) && local.inputBad]}
                                />
                              </View>
                            ))}
                          </ScrollView>
                          {totalOnly ? (
                            <Text style={[styles.small, { color: colors.muted, marginTop: 4 }]}>
                              {t('Only the total was entered. Typing question marks will replace it.')}
                            </Text>
                          ) : null}
                        </>
                      )}
                    </View>
                  );
                }

                return (
                  <View key={row.studentId} style={[styles.row, { alignItems: 'center' }, last]}>
                    {student}
                    <TextInput
                      value={e.absent ? '' : e.text}
                      onChangeText={(text) => update(row.studentId, { text: cleanNumber(text) })}
                      editable={!e.absent}
                      keyboardType="decimal-pad"
                      placeholder={e.absent ? 'AB' : '—'}
                      placeholderTextColor="#94A3B8"
                      accessibilityLabel={`Marks for ${row.studentName}`}
                      style={[local.input, bad.length > 0 && local.inputBad, e.absent && { backgroundColor: '#F1F5F9' }]}
                    />
                    {absentToggle}
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

/** Shows the paper's questions and lets the teacher set them (label + marks, adding up to the paper's max). */
function QuestionsEditor({ schedule, onSaved }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState(() => (schedule.questions ?? []).map((q) => ({ label: q.label, marks: String(q.maxMarks) })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const questions = schedule.questions ?? [];

  if (!editing) {
    return (
      <Card
        title="Questions"
        right={
          <Pressable onPress={() => setEditing(true)} accessibilityRole="button" hitSlop={8}>
            <Text style={local.link}>{t(questions.length > 0 ? 'Edit' : 'Add questions')}</Text>
          </Pressable>
        }
      >
        <Text style={styles.muted}>
          {questions.length > 0
            ? questions.map((q) => `${q.label} (${q.maxMarks})`).join(' · ')
            : t('No questions set. Marks are entered as a total.')}
        </Text>
      </Card>
    );
  }

  const sum = round2(rows.reduce((total, r) => total + (Number(r.marks) || 0), 0));
  const labels = rows.map((r) => r.label.trim());
  const problem =
    rows.length > 50
      ? t('At most 50 questions.')
      : labels.some((l) => l === '')
        ? t('Every question needs a label.')
        : new Set(labels.map((l) => l.toLowerCase())).size !== labels.length
          ? t('Question labels must be different.')
          : rows.some((r) => !(Number(r.marks) > 0))
            ? t('Every question needs marks above 0.')
            : rows.length > 0 && sum !== schedule.maxMarks
              ? `${t('Question marks must add up to the paper’s maximum.')} (${sum} / ${schedule.maxMarks})`
              : null;

  function change(index, patch) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function saveQuestions() {
    setSaving(true);
    setError(null);
    try {
      const body = { questions: rows.map((r) => ({ label: r.label.trim(), maxMarks: Number(r.marks) })) };
      await api(`/exam-schedules/${schedule.id}/questions`, { method: 'PUT', body });
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Questions">
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <TextInput
            value={r.label}
            onChangeText={(label) => change(i, { label })}
            placeholder={t('Label')}
            placeholderTextColor="#94A3B8"
            accessibilityLabel={`Label of question ${i + 1}`}
            style={[local.input, { flex: 1, textAlign: 'left', paddingHorizontal: 10 }]}
          />
          <TextInput
            value={r.marks}
            onChangeText={(text) => change(i, { marks: cleanNumber(text) })}
            keyboardType="decimal-pad"
            placeholder={t('Marks')}
            placeholderTextColor="#94A3B8"
            accessibilityLabel={`Marks of question ${i + 1}`}
            style={[local.input, { width: 80 }]}
          />
          <Pressable
            onPress={() => setRows((current) => current.filter((_, j) => j !== i))}
            accessibilityRole="button"
            accessibilityLabel={`Remove question ${i + 1}`}
            hitSlop={8}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => setRows((current) => [...current, { label: `Q${current.length + 1}`, marks: '' }])}
        accessibilityRole="button"
        style={{ paddingVertical: 6 }}
      >
        <Text style={local.link}>+ {t('Add question')}</Text>
      </Pressable>
      <Text style={[styles.muted, { marginVertical: 6 }]}>
        {t('Total')}: {sum} / {schedule.maxMarks}
        {rows.length === 0 ? ` · ${t('Saving with no questions removes them.')}` : ''}
      </Text>
      {problem ? <Text style={[styles.small, { color: colors.danger, marginBottom: 8 }]}>{problem}</Text> : null}
      {error ? <ErrorBox error={error} /> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={() => {
            setRows(questions.map((q) => ({ label: q.label, marks: String(q.maxMarks) })));
            setError(null);
            setEditing(false);
          }}
          style={{ flex: 1 }}
        />
        <Button title="Save questions" onPress={saveQuestions} loading={saving} disabled={problem != null} style={{ flex: 1 }} />
      </View>
    </Card>
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
  inputBad: { borderColor: colors.danger, borderWidth: 2, backgroundColor: colors.dangerSoft },
  questionInput: {
    width: 52,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  questionLabel: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 3 },
  studentBlock: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  totalLabel: { fontSize: 11, color: colors.muted },
  totalValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '700' },
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
