import { Badge, Button, Card, ErrorBox, api, capitalize, combine, styles, todayIso, useApi } from '@ssa/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';

const STATUS_TONE = { PRESENT: 'success', ABSENT: 'danger', LEAVE: 'info', HALF_DAY: 'warning' };

export function staffStatusLabel(status) {
  return status === 'HALF_DAY' ? 'Half day' : capitalize(status);
}

export function staffStatusTone(status) {
  return STATUS_TONE[status] ?? 'neutral';
}

/** Today's check in / check out for the signed-in teacher. */
export function CheckInCard() {
  const today = todayIso();
  const records = useApi(`/staff-attendance/records?from=${today}&to=${today}`);
  const holiday = useApi(`/calendar/check?date=${today}`);
  const state = combine(records, holiday);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function punch(kind) {
    setBusy(kind);
    setError(null);
    try {
      await api(`/staff-attendance/${kind}`, { method: 'POST' });
      records.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  if (state.loading) {
    return (
      <Card title="My attendance today">
        <Text style={styles.muted}>Loading…</Text>
      </Card>
    );
  }
  if (state.error && state.data == null) {
    return <ErrorBox error={state.error} onRetry={state.reload} />;
  }

  const [list, day] = state.data;
  const record = list.find((r) => r.date === today) ?? null;

  if (day.holiday) {
    return (
      <Card title="My attendance today" right={<Badge label="Holiday" tone="neutral" />}>
        <Text style={styles.muted}>{day.title || 'Holiday'} — no check-in needed.</Text>
      </Card>
    );
  }

  const checkedIn = Boolean(record?.checkIn);
  const checkedOut = Boolean(record?.checkOut);
  const away = record && (record.status === 'LEAVE' || record.status === 'ABSENT');

  return (
    <Card
      title="My attendance today"
      right={record ? <Badge label={staffStatusLabel(record.status)} tone={staffStatusTone(record.status)} /> : <Badge label="Not checked in" tone="warning" />}
    >
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Check in</Text>
          <Text style={[styles.body, { fontWeight: '700' }]}>{record?.checkIn ?? '—'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Check out</Text>
          <Text style={[styles.body, { fontWeight: '700' }]}>{record?.checkOut ?? '—'}</Text>
        </View>
      </View>
      {error ? <ErrorBox error={error} /> : null}
      {away ? (
        <Text style={styles.muted}>You are marked {staffStatusLabel(record.status).toLowerCase()} today.</Text>
      ) : !checkedIn ? (
        <Button title="Check in" icon="log-in-outline" onPress={() => punch('check-in')} loading={busy === 'check-in'} />
      ) : !checkedOut ? (
        <Button title="Check out" icon="log-out-outline" variant="secondary" onPress={() => punch('check-out')} loading={busy === 'check-out'} />
      ) : (
        <Text style={styles.muted}>Done for today.</Text>
      )}
    </Card>
  );
}
