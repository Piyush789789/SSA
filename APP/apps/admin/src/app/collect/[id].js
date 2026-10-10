import {
  Button,
  Card,
  Chips,
  ErrorBox,
  Field,
  Loaded,
  Row,
  Screen,
  SectionTitle,
  api,
  colors,
  combine,
  formatDate,
  formatDateTime,
  rupees,
  styles,
  useApi,
} from '@ssa/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function CollectPayment() {
  const { id, studentId } = useLocalSearchParams();
  const dues = useApi(`/fees/dues?studentId=${studentId}`);
  const meta = useApi('/meta');
  const state = combine(dues, meta);
  const due = dues.data?.find((d) => d.id === id);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (due && amount === '') setAmount(String(due.pending));
  }, [due, amount]);

  async function collect() {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError(new Error('Enter the amount in whole rupees.'));
      return;
    }
    if (value > due.pending) {
      setError(new Error(`The amount cannot be more than the pending ${rupees(due.pending)}.`));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payment = await api('/fees/payments', {
        method: 'POST',
        body: { feeDueId: id, amount: value, paymentMode: mode, remarks: remarks.trim() || null },
      });
      setReceipt(payment);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  if (receipt) {
    return (
      <Screen footer={<Button title="Done" onPress={() => router.back()} />}>
        <Card title="Payment recorded" style={{ borderColor: '#A7F3D0', backgroundColor: colors.successSoft }}>
          <Row label="Receipt no." value={receipt.receiptNo} />
          <Row label="Student" value={`${receipt.studentName} (${receipt.className})`} />
          <Row label="Fee" value={receipt.feeTitle} />
          <Row label="Amount" value={rupees(receipt.amount)} />
          <Row label="Mode" value={receipt.paymentMode} />
          <Row label="Date" value={formatDateTime(receipt.paidAt)} last />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Record payment" icon="cash-outline" onPress={collect} loading={saving} disabled={!due || due.pending === 0} />}>
      <Loaded state={state}>
        {([, metaData]) =>
          !due ? (
            <Text style={styles.muted}>This fee could not be found.</Text>
          ) : (
            <>
              <Card title={due.title}>
                <Row label="Student" value={`${due.studentName} (${due.className})`} />
                <Row label="Amount" value={rupees(due.amount)} />
                {due.concession > 0 ? <Row label="Concession" value={`− ${rupees(due.concession)}`} /> : null}
                <Row label="Already paid" value={rupees(due.paid)} />
                <Row label="Pending" value={rupees(due.pending)} />
                <Row label="Due date" value={formatDate(due.dueDate)} last />
              </Card>
              <Field label="Amount (₹)" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
              <SectionTitle>Payment mode</SectionTitle>
              <Chips options={metaData.paymentModes.map((m) => ({ label: m, value: m }))} value={mode} onChange={setMode} />
              <Field label="Remarks (optional)" value={remarks} onChangeText={setRemarks} placeholder="e.g. cheque number" />
              {error ? <ErrorBox error={error} /> : null}
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}
