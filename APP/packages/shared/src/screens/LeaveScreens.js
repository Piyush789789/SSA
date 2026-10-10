import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { api } from '../api';
import { useAuth } from '../auth';
import { addDaysIso, daysAgoIso, formatDate, formatDateTime, todayIso } from '../format';
import { actorIdOf, useApi } from '../useApi';
import { Badge, Button, Card, Chips, DateStepper, Empty, ErrorBox, Field, InfoCard, Loaded, Screen, SectionTitle, styles } from '../ui';

const STATUS_LOOK = {
  PENDING: { label: 'Pending', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};
const MAX_DAYS = 60;
const MAX_DAYS_BACK = 30;

function dayCount(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

function rangeText(leave) {
  const days = dayCount(leave.fromDate, leave.toDate);
  return leave.fromDate === leave.toDate
    ? `${formatDate(leave.fromDate)} · 1 day`
    : `${formatDate(leave.fromDate)} – ${formatDate(leave.toDate)} · ${days} days`;
}

/**
 * "Apply for leave" plus the list of applications. Students apply for themselves, parents pass the
 * child's `studentId`, teachers use `type="STAFF"` for their own leave.
 */
export function LeaveScreen({ studentId, type, header }) {
  const { user } = useAuth();
  const state = useApi(type ? `/leaves?type=${type}` : '/leaves');
  const today = todayIso();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const me = [user?.id, actorIdOf(user)];

  function changeFrom(next) {
    setFromDate(next);
    if (toDate < next) setToDate(next);
  }

  async function apply() {
    if (!reason.trim()) {
      setError(new Error('Write the reason for the leave.'));
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api('/leaves', { method: 'POST', body: { studentId: studentId ?? null, fromDate, toDate, reason: reason.trim() } });
      setMessage('Leave application sent. You will be notified when it is reviewed.');
      setReason('');
      state.reload();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  function withdraw(leave) {
    Alert.alert('Withdraw application', `Withdraw the leave for ${rangeText(leave)}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/leaves/${leave.id}`, { method: 'DELETE' });
            state.reload();
          } catch (e) {
            Alert.alert('Could not withdraw', e.message);
          }
        },
      },
    ]);
  }

  const days = dayCount(fromDate, toDate);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Card title="Apply for leave">
        <DateStepper label="From" value={fromDate} onChange={changeFrom} min={daysAgoIso(MAX_DAYS_BACK)} />
        <DateStepper label="To" value={toDate} onChange={setToDate} min={fromDate} max={addDaysIso(fromDate, MAX_DAYS - 1)} />
        <Text style={[styles.muted, { marginBottom: 10 }]}>
          {days} {days === 1 ? 'day' : 'days'} · at most {MAX_DAYS} days per application
        </Text>
        <Field label="Reason" value={reason} onChangeText={setReason} multiline maxLength={1000} placeholder="e.g. Fever, doctor advised rest" />
        {error ? <ErrorBox error={error} /> : null}
        {message ? <InfoCard text={message} /> : null}
        <Button title="Apply" icon="send-outline" onPress={apply} loading={saving} />
      </Card>

      <SectionTitle>Applications</SectionTitle>
      <Loaded state={state}>
        {(list) => {
          const shown = studentId ? list.filter((l) => l.personId === studentId) : list;
          return shown.length === 0 ? (
            <Empty text="No leave applications yet." icon="airplane-outline" />
          ) : (
            shown.map((leave) => {
              const look = STATUS_LOOK[leave.status] ?? { label: leave.status, tone: 'neutral' };
              const canWithdraw = leave.status === 'PENDING' && me.includes(leave.appliedById);
              return (
                <Card key={leave.id} title={rangeText(leave)} right={<Badge label={look.label} tone={look.tone} />}>
                  <Text style={styles.body}>{leave.reason}</Text>
                  <Text style={[styles.muted, { marginTop: 4 }]}>
                    Applied by {leave.appliedByName} · {formatDateTime(leave.appliedAt)}
                  </Text>
                  {leave.reviewedByName ? (
                    <Text style={[styles.muted, { marginTop: 4 }]}>
                      {look.label} by {leave.reviewedByName}
                      {leave.reviewNote ? `: “${leave.reviewNote}”` : ''}
                    </Text>
                  ) : null}
                  {canWithdraw ? (
                    <Button title="Withdraw" variant="secondary" onPress={() => withdraw(leave)} style={{ marginTop: 10, paddingVertical: 8 }} />
                  ) : null}
                </Card>
              );
            })
          );
        }}
      </Loaded>
    </Screen>
  );
}

/**
 * Leave applications to approve or reject. Teachers see their classes' students (`types={['STUDENT']}`);
 * admins switch between staff and student leave.
 */
export function LeaveRequestsScreen({ types = ['STUDENT'] }) {
  const [type, setType] = useState(types[0]);
  const [status, setStatus] = useState('PENDING');
  const state = useApi(`/leaves?type=${type}${status ? `&status=${status}` : ''}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {types.length > 1 ? (
        <Chips options={types.map((t) => ({ label: t === 'STAFF' ? 'Staff' : 'Students', value: t }))} value={type} onChange={setType} />
      ) : null}
      <Chips
        options={[
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'All', value: '' },
        ]}
        value={status}
        onChange={setStatus}
      />
      <Loaded state={state}>
        {(list) => {
          // Pending first, then newest first (the server's order).
          const sorted = [...list].sort((a, b) => (a.status === 'PENDING' ? 0 : 1) - (b.status === 'PENDING' ? 0 : 1));
          return sorted.length === 0 ? (
            <Empty text={status === 'PENDING' ? 'No pending leave requests.' : 'No leave requests.'} icon="airplane-outline" />
          ) : (
            sorted.map((leave) => <LeaveRequestCard key={leave.id} leave={leave} onDecided={state.reload} />)
          );
        }}
      </Loaded>
    </Screen>
  );
}

function LeaveRequestCard({ leave, onDecided }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const look = STATUS_LOOK[leave.status] ?? { label: leave.status, tone: 'neutral' };

  async function decide(approve) {
    setBusy(approve ? 'approve' : 'reject');
    setError(null);
    try {
      await api(`/leaves/${leave.id}/decision`, { method: 'POST', body: { approve, note: note.trim() || null } });
      onDecided();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  const who = leave.applicantType === 'STUDENT' ? `${leave.personName} · Class ${leave.className}` : leave.personName;

  return (
    <Card title={who} right={<Badge label={look.label} tone={look.tone} />}>
      <Text style={[styles.body, { fontWeight: '600' }]}>{rangeText(leave)}</Text>
      <Text style={[styles.body, { marginTop: 4 }]}>{leave.reason}</Text>
      <Text style={[styles.muted, { marginTop: 4 }]}>
        Applied by {leave.appliedByName} · {formatDateTime(leave.appliedAt)}
      </Text>
      {leave.reviewedByName ? (
        <Text style={[styles.muted, { marginTop: 4 }]}>
          {look.label} by {leave.reviewedByName} · {formatDateTime(leave.reviewedAt)}
          {leave.reviewNote ? `: “${leave.reviewNote}”` : ''}
        </Text>
      ) : null}
      {leave.status === 'PENDING' ? (
        <View style={{ marginTop: 10 }}>
          <Field value={note} onChangeText={setNote} placeholder="Note (optional)" maxLength={500} style={{ marginBottom: 10 }} />
          {error ? <ErrorBox error={error} /> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Approve" icon="checkmark-outline" onPress={() => decide(true)} loading={busy === 'approve'} disabled={!!busy} style={{ flex: 1 }} />
            <Button title="Reject" variant="danger" icon="close-outline" onPress={() => decide(false)} loading={busy === 'reject'} disabled={!!busy} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
