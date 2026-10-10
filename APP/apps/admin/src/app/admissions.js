import {
  Badge,
  Button,
  Card,
  Chips,
  DateStepper,
  Empty,
  ErrorBox,
  Field,
  Loaded,
  Screen,
  Stat,
  StatGrid,
  api,
  callPhone,
  capitalize,
  colors,
  formatDate,
  formatDateTime,
  styles,
  todayIso,
  useApi,
  useT,
} from '@ssa/shared';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

const STATUSES = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ADMITTED', 'CLOSED'];
// ADMITTED is set by "Admit" on the website (it creates the student), not by a status change.
const SETTABLE = STATUSES.filter((s) => s !== 'ADMITTED');
const TONES = { NEW: 'info', CONTACTED: 'warning', VISITED: 'warning', APPLIED: 'primary', ADMITTED: 'success', CLOSED: 'neutral' };

/** Admission enquiries: counts by status, a filter and search, and a quick status change with notes. */
export default function Admissions() {
  const t = useT();
  const [status, setStatus] = useState('NEW');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const stats = useApi('/enquiries/stats');
  const params = [status !== 'ALL' ? `status=${status}` : null, query ? `q=${encodeURIComponent(query)}` : null].filter(Boolean).join('&');
  const list = useApi(`/enquiries${params ? `?${params}` : ''}`);

  function reloadAll() {
    stats.reload();
    list.reload();
  }

  const counts = stats.data?.byStatus ?? {};
  const options = [
    { label: 'All', value: 'ALL' },
    ...STATUSES.map((s) => ({ label: `${t(capitalize(s))}${counts[s] != null ? ` (${counts[s]})` : ''}`, value: s })),
  ];

  return (
    <Screen refreshing={stats.refreshing || list.refreshing} onRefresh={reloadAll}>
      <Loaded state={stats}>
        {(s) => (
          <StatGrid>
            <Stat label="New enquiries" value={s.byStatus?.NEW ?? 0} icon="mail-unread-outline" tone="info" />
            <Stat label="Follow-ups due" value={s.followUpsDue ?? 0} icon="alarm-outline" tone={s.followUpsDue ? 'danger' : 'neutral'} />
            <Stat label="New this month" value={s.newThisMonth ?? 0} icon="trending-up-outline" tone="primary" />
            <Stat label="Admitted this month" value={s.admittedThisMonth ?? 0} icon="school-outline" tone="success" />
          </StatGrid>
        )}
      </Loaded>
      <Field
        value={text}
        onChangeText={setText}
        placeholder="Search name or phone"
        returnKeyType="search"
        onSubmitEditing={() => setQuery(text.trim())}
        onBlur={() => setQuery(text.trim())}
        autoCapitalize="none"
      />
      <Chips options={options} value={status} onChange={setStatus} />
      <Loaded state={list}>
        {(enquiries) =>
          enquiries.length === 0 ? (
            <Empty text="No enquiries here." icon="mail-open-outline" />
          ) : (
            enquiries.map((e) => <EnquiryCard key={`${e.id}-${e.updatedAt}`} enquiry={e} onSaved={reloadAll} />)
          )
        }
      </Loaded>
    </Screen>
  );
}

function EnquiryCard({ enquiry: e, onSaved }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState(e.status === 'ADMITTED' ? 'CLOSED' : e.status);
  const [withFollowUp, setWithFollowUp] = useState(Boolean(e.followUpDate));
  const [followUp, setFollowUp] = useState(e.followUpDate ?? todayIso());
  const [notes, setNotes] = useState(e.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const due = e.followUpDate && e.followUpDate <= todayIso() && !['ADMITTED', 'CLOSED'].includes(e.status);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api(`/enquiries/${e.id}/status`, {
        method: 'POST',
        body: { status: next, followUpDate: withFollowUp ? followUp : null, notes: notes.trim() || null },
      });
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={e.studentName} right={<Badge label={capitalize(e.status)} tone={TONES[e.status]} />}>
      <Text style={styles.body}>
        Class {e.classSought}
        {e.gender ? ` · ${e.gender}` : ''}
        {e.dateOfBirth ? ` · DOB ${formatDate(e.dateOfBirth)}` : ''}
      </Text>
      <Pressable onPress={() => callPhone(e.phone)} accessibilityRole="button" accessibilityLabel={`Call ${e.parentName}`}>
        <Text style={[styles.body, { color: colors.info, marginTop: 2 }]}>
          {e.parentName} · {e.phone}
        </Text>
      </Pressable>
      {e.email ? <Text style={styles.muted}>{e.email}</Text> : null}
      {e.previousSchool ? <Text style={styles.muted}>Previous school: {e.previousSchool}</Text> : null}
      <Text style={[styles.muted, styles.small, { marginTop: 4 }]}>
        {e.source ? `${capitalize(e.source)} · ` : ''}
        {formatDateTime(e.createdAt)}
      </Text>
      {e.followUpDate ? (
        <Text style={[styles.muted, due && { color: colors.danger, fontWeight: '700' }]}>Follow up {formatDate(e.followUpDate)}</Text>
      ) : null}
      {e.notes && !open ? <Text style={[styles.muted, { marginTop: 4 }]}>Notes: {e.notes}</Text> : null}
      {e.admittedStudentId ? <Text style={[styles.muted, { marginTop: 4 }]}>Admitted as {e.admittedStudentId}</Text> : null}

      {open ? (
        <View style={{ marginTop: 10 }}>
          <Chips options={SETTABLE.map((s) => ({ label: capitalize(s), value: s }))} value={next} onChange={setNext} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.label}>{t('Follow-up date')}</Text>
            <Switch value={withFollowUp} onValueChange={setWithFollowUp} />
          </View>
          {withFollowUp ? <DateStepper value={followUp} onChange={setFollowUp} /> : null}
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline maxLength={2000} placeholder="e.g. Visited campus, will apply next week" />
          {error ? <ErrorBox error={error} /> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} disabled={saving} style={{ flex: 1 }} />
            <Button title="Save" icon="checkmark" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      ) : e.status !== 'ADMITTED' ? (
        <Button title="Change status" variant="secondary" onPress={() => setOpen(true)} style={{ marginTop: 10, paddingVertical: 8 }} />
      ) : null}
    </Card>
  );
}
