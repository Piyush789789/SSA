import {
  Button,
  Card,
  Chips,
  Empty,
  ErrorBox,
  Field,
  ListItem,
  Loaded,
  Screen,
  SectionTitle,
  api,
  colors,
  formatDateTime,
  styles,
  useApi,
  useAuth,
} from '@ssa/shared';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

const TERMS = ['Term 1', 'Term 2'];
const GRADES = ['A', 'B', 'C'].map((g) => ({ label: g, value: g }));

/** Class teacher's co-scholastic grades and remark for a student's report card, per term. */
export default function ReportCardNotes() {
  const { profile } = useAuth();
  const classes = profile?.assignedClasses ?? [];
  const [className, setClassName] = useState(classes[0]);
  const [student, setStudent] = useState(null);

  const roster = useApi(className ? `/classes/${className}/students` : null);

  function pickClass(next) {
    setClassName(next);
    setStudent(null);
  }

  if (student) {
    return <StudentNotes key={student.id} student={student} onChange={() => setStudent(null)} />;
  }

  return (
    <Screen refreshing={roster.refreshing} onRefresh={roster.reload}>
      <SectionTitle>Class</SectionTitle>
      {classes.length === 0 ? (
        <Empty text="You have no classes assigned." icon="people-outline" />
      ) : (
        <Chips options={classes.map((c) => ({ label: `Class ${c}`, value: c }))} value={className} onChange={pickClass} />
      )}
      {className ? (
        <>
          <SectionTitle>Student</SectionTitle>
          <Loaded state={roster}>
            {(list) =>
              list.length === 0 ? (
                <Empty text="No students in this class." icon="people-outline" />
              ) : (
                list.map((s) => (
                  <ListItem
                    key={s.id}
                    icon="person-outline"
                    title={s.name}
                    subtitle={`Roll no. ${s.rollNumber ?? '—'}`}
                    onPress={() => setStudent(s)}
                  />
                ))
              )
            }
          </Loaded>
        </>
      ) : null}
    </Screen>
  );
}

function StudentNotes({ student, onChange }) {
  const card = useApi(`/report-cards/${student.id}`);
  const [term, setTerm] = useState(TERMS[0]);
  const [grades, setGrades] = useState({});
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Start from what is saved for this term; keep unsaved edits when the screen refocuses.
  const loadedTerm = useRef(null);
  useEffect(() => {
    if (card.data && loadedTerm.current !== term) {
      loadedTerm.current = term;
      const note = (card.data.notes ?? []).find((n) => n.term === term);
      setGrades(note?.coScholastic ?? {});
      setRemark(note?.remark ?? '');
      setMessage(null);
      setError(null);
    }
  }, [card.data, term]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api(`/report-cards/${student.id}/notes`, {
        method: 'PUT',
        body: { term, academicYear: card.data?.academicYear, remark: remark.trim(), coScholastic: grades },
      });
      setMessage(`${term} notes saved for ${student.name}.`);
      card.reload();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      refreshing={card.refreshing}
      onRefresh={card.reload}
      footer={<Button title={`Save ${term} notes`} icon="save-outline" onPress={save} loading={saving} disabled={!card.data} />}
    >
      <Card
        title={student.name}
        right={<Button title="Change" variant="secondary" onPress={onChange} style={{ paddingVertical: 6 }} />}
      >
        <Text style={styles.muted}>
          Class {student.className} · Roll no. {student.rollNumber ?? '—'}
        </Text>
      </Card>
      <Loaded state={card}>
        {(data) => {
          const saved = (data.notes ?? []).find((n) => n.term === term);
          return (
            <>
              <SectionTitle>Term</SectionTitle>
              <Chips options={TERMS.map((t) => ({ label: t, value: t }))} value={term} onChange={setTerm} />
              {saved?.updatedBy ? (
                <Text style={[styles.muted, { marginBottom: 10 }]}>
                  Last saved by {saved.updatedBy} · {formatDateTime(saved.updatedAt)}
                </Text>
              ) : null}

              <SectionTitle>Co-scholastic grades</SectionTitle>
              {(data.coScholasticAreas ?? []).map((area) => (
                <View key={area} style={[styles.card, { paddingBottom: 2 }]}>
                  <Text style={[styles.label, { marginBottom: 8 }]}>{area}</Text>
                  <Chips options={GRADES} value={grades[area]} onChange={(g) => setGrades((prev) => ({ ...prev, [area]: g }))} />
                </View>
              ))}

              <Field
                label="Class teacher’s remark"
                value={remark}
                onChangeText={setRemark}
                multiline
                maxLength={1000}
                placeholder="e.g. Sincere and attentive; should practise maths regularly."
              />
              {message ? (
                <Card style={{ backgroundColor: colors.successSoft, borderColor: '#A7F3D0' }}>
                  <Text style={[styles.body, { color: colors.success }]}>{message}</Text>
                </Card>
              ) : null}
              {error ? <ErrorBox error={error} /> : null}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}
