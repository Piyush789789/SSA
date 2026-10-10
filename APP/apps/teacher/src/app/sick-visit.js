import {
  Button,
  Card,
  Chips,
  Empty,
  ErrorBox,
  Field,
  InfoCard,
  ListItem,
  Loaded,
  Screen,
  SectionTitle,
  VisitList,
  api,
  colors,
  styles,
  useApi,
  useAuth,
  useT,
} from '@ssa/shared';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

/** Record a sick-room visit: pick a class, then a student, then fill the form. The family is notified. */
export default function SickVisit() {
  const { profile } = useAuth();
  const classes = profile?.assignedClasses ?? [];
  const [className, setClassName] = useState(classes[0] ?? null);
  const [student, setStudent] = useState(null);
  const [query, setQuery] = useState('');
  const roster = useApi(className && !student ? `/classes/${className}/students` : null);

  if (student) {
    return <VisitForm key={student.id} student={student} onBack={() => setStudent(null)} />;
  }

  const q = query.trim().toLowerCase();
  return (
    <Screen refreshing={roster.refreshing} onRefresh={roster.reload}>
      {classes.length === 0 ? (
        <Empty text="You have no classes assigned." icon="people-outline" />
      ) : (
        <>
          <Chips options={classes.map((c) => ({ label: `Class ${c}`, value: c }))} value={className} onChange={setClassName} />
          <Field value={query} onChangeText={setQuery} placeholder="Search by name or roll number" autoCapitalize="none" />
          <Loaded state={roster}>
            {(list) => {
              const shown = q
                ? list.filter((s) => s.name.toLowerCase().includes(q) || String(s.rollNumber ?? '') === q)
                : list;
              return shown.length === 0 ? (
                <Empty text="No students found." icon="search-outline" />
              ) : (
                shown.map((s) => (
                  <ListItem
                    key={s.id}
                    icon="person-outline"
                    title={s.name}
                    subtitle={`Roll ${s.rollNumber ?? '—'} · ${s.id}`}
                    onPress={() => setStudent(s)}
                  />
                ))
              );
            }}
          </Loaded>
        </>
      )}
    </Screen>
  );
}

function VisitForm({ student, onBack }) {
  const t = useT();
  const record = useApi(`/health-records/${student.id}`);
  const visits = useApi(`/health-records/${student.id}/visits`);
  const [complaint, setComplaint] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [sentHome, setSentHome] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function save() {
    if (!complaint.trim()) {
      setError(new Error('Describe the complaint.'));
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api(`/health-records/${student.id}/visits`, {
        method: 'POST',
        body: { complaint: complaint.trim(), actionTaken: actionTaken.trim() || null, sentHome },
      });
      setMessage(sentHome ? 'Visit recorded. The family has been notified by app and SMS.' : 'Visit recorded. The family has been notified.');
      setComplaint('');
      setActionTaken('');
      setSentHome(false);
      visits.reload();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  const r = record.data;
  const alerts = [r?.allergies && `Allergies: ${r.allergies}`, r?.conditions && `Conditions: ${r.conditions}`, r?.medications && `Medicines: ${r.medications}`].filter(Boolean);

  return (
    <Screen refreshing={visits.refreshing} onRefresh={visits.reload}>
      <Card title={student.name}>
        <Text style={styles.muted}>
          Class {student.className} · Roll {student.rollNumber ?? '—'}
        </Text>
        {alerts.map((line) => (
          <Text key={line} style={[styles.body, { color: colors.danger, marginTop: 4 }]}>
            {line}
          </Text>
        ))}
        {r?.emergencyContactPhone ? (
          <Text style={[styles.muted, { marginTop: 4 }]}>
            Emergency: {r.emergencyContactName ?? ''} {r.emergencyContactPhone}
          </Text>
        ) : null}
      </Card>
      {message ? <InfoCard text={message} /> : null}
      <Card title="Record sick-room visit">
        <Field label="Complaint" value={complaint} onChangeText={setComplaint} multiline maxLength={1000} placeholder="e.g. Headache and mild fever" />
        <Field label="Action taken (optional)" value={actionTaken} onChangeText={setActionTaken} multiline maxLength={1000} placeholder="e.g. Rested for 30 minutes, gave water" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('Sent home')}</Text>
            <Text style={styles.muted}>The family also gets an SMS.</Text>
          </View>
          <Switch value={sentHome} onValueChange={setSentHome} trackColor={{ true: colors.primary }} />
        </View>
        {error ? <ErrorBox error={error} /> : null}
        <Button title="Record visit" icon="medkit-outline" onPress={save} loading={saving} style={{ marginBottom: 8 }} />
        <Button title="Back" variant="secondary" icon="arrow-back" onPress={onBack} disabled={saving} />
      </Card>
      <SectionTitle>Sick-room visits</SectionTitle>
      <Loaded state={visits}>{(list) => <VisitList visits={list ?? []} />}</Loaded>
    </Screen>
  );
}
