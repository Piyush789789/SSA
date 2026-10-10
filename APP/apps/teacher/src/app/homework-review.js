import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  ErrorBox,
  Field,
  FileThumb,
  Loaded,
  Screen,
  SectionTitle,
  api,
  combine,
  fileSource,
  formatDate,
  formatDateTime,
  styles,
  submissionLabel,
  useApi,
} from '@ssa/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'To check', value: 'SUBMITTED' },
  { label: 'Checked', value: 'REVIEWED' },
  { label: 'Redo', value: 'REDO' },
  { label: 'Not submitted', value: 'none' },
];

/** A homework's submissions (n/total) with photo thumbnails; mark checked or ask to redo. Opened with ?homeworkId=. */
export default function HomeworkReview() {
  const { homeworkId } = useLocalSearchParams();
  const homework = useApi('/homework');
  const rows = useApi(`/homework/${homeworkId}/submissions`);
  const state = combine(homework, rows);
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null); // file id shown full screen
  const [deleting, setDeleting] = useState(false);

  const hw = homework.data?.find((h) => h.id === homeworkId);

  function confirmDelete() {
    Alert.alert('Delete homework', `Delete "${hw.title}" for class ${hw.className}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api(`/homework/${hw.id}`, { method: 'DELETE' });
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Loaded state={state}>
        {([, list]) => {
          if (!hw) return <Text style={styles.muted}>This homework could not be found.</Text>;
          const submitted = list.filter((r) => r.submission).length;
          const toCheck = list.filter((r) => r.submission?.status === 'SUBMITTED').length;
          const shown = list.filter((r) =>
            filter === 'all' ? true : filter === 'none' ? !r.submission : r.submission?.status === filter,
          );
          return (
            <>
              <Card title={hw.title} right={<Badge label={`Due ${formatDate(hw.dueDate)}`} tone="info" />}>
                <Text style={styles.muted}>
                  {hw.subject} · Class {hw.className}
                </Text>
                <Text style={[styles.body, { marginTop: 6, fontWeight: '700' }]}>
                  Submissions {submitted}/{list.length}
                  {toCheck > 0 ? ` · ${toCheck} to check` : ''}
                </Text>
              </Card>
              <Chips options={FILTERS} value={filter} onChange={setFilter} />
              {shown.length === 0 ? (
                <Empty text="No students here." icon="people-outline" />
              ) : (
                shown.map((row) => (
                  <SubmissionCard
                    key={`${row.studentId}-${row.submission?.status}-${row.submission?.reviewedAt}`}
                    row={row}
                    onSaved={rows.reload}
                    onView={setViewing}
                  />
                ))
              )}
              <SectionTitle>Homework</SectionTitle>
              <Button title="Delete this homework" variant="danger" icon="trash-outline" onPress={confirmDelete} loading={deleting} />
            </>
          );
        }}
      </Loaded>

      <Modal visible={viewing != null} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable style={local.viewer} onPress={() => setViewing(null)} accessibilityRole="button" accessibilityLabel="Close photo">
          {viewing ? <Image source={fileSource(viewing)} style={local.full} resizeMode="contain" /> : null}
          <Text style={local.close}>Tap to close</Text>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function SubmissionCard({ row, onSaved, onView }) {
  const s = row.submission;
  const [grade, setGrade] = useState(s?.grade ?? '');
  const [feedback, setFeedback] = useState(s?.feedback ?? '');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(s?.status === 'SUBMITTED');

  async function review(status) {
    setBusy(status);
    setError(null);
    try {
      await api(`/homework-submissions/${s.id}/review`, {
        method: 'POST',
        body: { status, grade: grade.trim() || null, feedback: feedback.trim() || null },
      });
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  const title = `${row.rollNumber != null ? `${row.rollNumber}. ` : ''}${row.studentName}`;
  if (!s) {
    return <Card title={title} right={<Badge label="Not submitted" tone="neutral" />} />;
  }
  const status = submissionLabel(s);

  return (
    <Card title={title} right={<Badge label={status.label} tone={status.tone} />}>
      <Text style={styles.muted}>
        {formatDateTime(s.submittedAt)}
        {s.late ? ' · late' : ''}
        {s.reviewedBy ? ` · checked by ${s.reviewedBy}` : ''}
      </Text>
      {s.text ? <Text style={[styles.body, { marginTop: 6 }]}>{s.text}</Text> : null}
      {s.fileIds?.length ? (
        <View style={local.photos}>
          {s.fileIds.map((id) => (
            <FileThumb key={id} fileId={id} size={72} onPress={() => onView(id)} />
          ))}
        </View>
      ) : null}
      {s.feedback && !open ? <Text style={[styles.muted, { marginTop: 6 }]}>Feedback: “{s.feedback}”</Text> : null}

      {open ? (
        <View style={{ marginTop: 10 }}>
          <Field label="Grade (optional)" value={grade} onChangeText={setGrade} placeholder="e.g. A" maxLength={10} autoCapitalize="characters" />
          <Field label="Feedback (optional)" value={feedback} onChangeText={setFeedback} multiline maxLength={2000} placeholder="e.g. Neat work; check Q3 again." />
          {error ? <ErrorBox error={error} /> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Mark checked" icon="checkmark-done-outline" onPress={() => review('REVIEWED')} loading={busy === 'REVIEWED'} disabled={!!busy} style={{ flex: 1 }} />
            <Button title="Ask to redo" icon="refresh-outline" variant="secondary" onPress={() => review('REDO')} loading={busy === 'REDO'} disabled={!!busy} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Button title="Review again" variant="secondary" onPress={() => setOpen(true)} style={{ marginTop: 10, paddingVertical: 8 }} />
      )}
    </Card>
  );
}

const local = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '85%' },
  close: { color: '#fff', marginTop: 12, fontWeight: '600' },
});
