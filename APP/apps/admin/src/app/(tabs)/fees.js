import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Loaded,
  Screen,
  SectionTitle,
  Stat,
  StatGrid,
  api,
  formatDate,
  formatDateTime,
  rupees,
  styles,
  useApi,
  useT,
} from '@ssa/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

const FILTERS = [
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Part-paid', value: 'Partial' },
  { label: 'Pending', value: 'Pending' },
];

/** Fee position, deposits families reported from the app, and unpaid dues (tap one to record a payment). */
export default function Fees() {
  const [status, setStatus] = useState('Overdue');
  const overview = useApi('/fees/overview');
  const deposits = useApi('/fees/deposits?status=PENDING');
  const dues = useApi(`/fees/dues?status=${status}`);
  const [busy, setBusy] = useState(null);
  const [reminding, setReminding] = useState(false);
  const t = useT();

  function reloadAll() {
    overview.reload();
    deposits.reload();
    dues.reload();
  }

  function review(deposit, approve) {
    Alert.alert(
      approve ? 'Approve deposit' : 'Reject deposit',
      approve
        ? `Confirm ${rupees(deposit.amount)} (${deposit.paymentMode} ${deposit.referenceNo}) was received? A receipt will be issued.`
        : `Reject ${rupees(deposit.amount)} from ${deposit.studentName}? Use this if the money did not arrive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approve ? 'Approve' : 'Reject',
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(deposit.id);
            try {
              await api(`/fees/deposits/${deposit.id}/${approve ? 'approve' : 'reject'}`, {
                method: 'POST',
                body: { note: approve ? null : 'Payment not found in the school account' },
              });
              reloadAll();
            } catch (e) {
              Alert.alert('Could not update', e.message);
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  function sendReminders() {
    Alert.alert(t('Send fee reminders now'), 'Remind every family with pending or overdue fees now? Each family gets at most one reminder a day (they also go out automatically at 9 AM).', [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Send'),
        onPress: async () => {
          setReminding(true);
          try {
            const result = await api('/fee-reminders/send', { method: 'POST' });
            Alert.alert('Reminders sent', `${result?.familiesReminded ?? 0} famil${result?.familiesReminded === 1 ? 'y' : 'ies'} reminded.`);
          } catch (e) {
            Alert.alert('Could not send reminders', e.message);
          } finally {
            setReminding(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen refreshing={overview.refreshing || dues.refreshing || deposits.refreshing} onRefresh={reloadAll}>
      <Loaded state={overview}>
        {(o) => (
          <StatGrid>
            <Stat label="Collected today" value={rupees(o.collectedToday)} tone="success" icon="today-outline" />
            <Stat label="Collected (year)" value={rupees(o.collected)} tone="success" icon="cash-outline" />
            <Stat label="Pending" value={rupees(o.pending)} tone="warning" icon="hourglass-outline" />
            <Stat label="Overdue" value={rupees(o.overdue)} tone="danger" icon="alert-circle-outline" />
          </StatGrid>
        )}
      </Loaded>
      <Button
        title="Send fee reminders now"
        icon="notifications-outline"
        variant="secondary"
        onPress={sendReminders}
        loading={reminding}
        style={{ marginBottom: 12 }}
      />

      <SectionTitle>Deposits to verify</SectionTitle>
      <Loaded state={deposits}>
        {(list) =>
          list.length === 0 ? (
            <Empty text="No deposits waiting for verification." icon="checkmark-done-outline" />
          ) : (
            list.map((d) => (
              <Card key={d.id} title={`${d.studentName} (${d.className})`} right={<Badge label={rupees(d.amount)} tone="warning" />}>
                <Text style={styles.body}>{d.feeTitle}</Text>
                <Text style={styles.muted}>
                  {d.paymentMode} · Ref {d.referenceNo} · Paid {formatDate(d.paidOn)}
                </Text>
                <Text style={styles.muted}>
                  Sent by {d.submittedBy} · {formatDateTime(d.submittedAt)}
                </Text>
                {d.note ? <Text style={[styles.muted, { marginTop: 4 }]}>Note: {d.note}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Button title="Reject" variant="secondary" onPress={() => review(d, false)} disabled={busy === d.id} style={{ flex: 1 }} />
                  <Button title="Approve" icon="checkmark" onPress={() => review(d, true)} loading={busy === d.id} style={{ flex: 1 }} />
                </View>
              </Card>
            ))
          )
        }
      </Loaded>

      <SectionTitle>Unpaid fees</SectionTitle>
      <Chips options={FILTERS} value={status} onChange={setStatus} />
      <Loaded state={dues}>
        {(list) =>
          list.length === 0 ? (
            <Empty text={`No ${status.toLowerCase()} fees.`} icon="checkmark-done-outline" />
          ) : (
            list.map((due) => (
              <Card
                key={due.id}
                title={`${due.studentName} (${due.className})`}
                right={<Badge label={rupees(due.pending)} tone={due.status === 'Overdue' ? 'danger' : 'warning'} />}
                onPress={() => router.push({ pathname: '/collect/[id]', params: { id: due.id, studentId: due.studentId } })}
              >
                <Text style={styles.body}>{due.title}</Text>
                <Text style={styles.muted}>
                  Due {formatDate(due.dueDate)} · Paid {rupees(due.paid)} of {rupees(due.amount - due.concession)}
                </Text>
              </Card>
            ))
          )
        }
      </Loaded>
    </Screen>
  );
}
