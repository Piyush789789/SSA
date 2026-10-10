import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { api } from '../api';
import { daysAgoIso, formatDate, rupees, todayIso } from '../format';
import { colors } from '../theme';
import { combine, useApi } from '../useApi';
import { Badge, Button, Card, Chips, ErrorBox, Field, Loaded, Row, Screen, SectionTitle, styles } from '../ui';

/**
 * A student or parent reports a fee they paid by UPI / bank transfer / cheque / DD. Opened with
 * ?dueId=&studentId=. The school office verifies it before it counts as paid.
 */
export function DepositScreen() {
  const { dueId, studentId } = useLocalSearchParams();
  const summary = useApi(`/fees/students/${studentId}/summary`);
  const deposits = useApi(`/fees/deposits?studentId=${studentId}`);
  const meta = useApi('/meta');
  const state = combine(summary, deposits, meta);

  const due = summary.data?.dues.find((d) => d.id === dueId);
  const verifying = (deposits.data ?? [])
    .filter((d) => d.feeDueId === dueId && d.status === 'PENDING')
    .reduce((sum, d) => sum + d.amount, 0);
  const payable = due ? Math.max(0, due.pending - verifying) : 0;

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(todayIso());
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    if (due && amount === '' && payable > 0) setAmount(String(payable));
  }, [due, amount, payable]);

  async function submit() {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError(new Error('Enter the amount you paid, in whole rupees.'));
      return;
    }
    if (value > payable) {
      setError(new Error(`You can deposit at most ${rupees(payable)} for this fee.`));
      return;
    }
    if (!reference.trim()) {
      setError(new Error(mode === 'Cheque' || mode === 'DD' ? 'Enter the cheque / DD number.' : 'Enter the transaction (UTR) number.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const deposit = await api('/fees/deposits', {
        method: 'POST',
        body: { feeDueId: dueId, amount: value, paymentMode: mode, referenceNo: reference.trim(), paidOn, note: note.trim() || null },
      });
      setSubmitted(deposit);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <Screen footer={<Button title="Done" onPress={() => router.back()} />}>
        <Card title="Deposit submitted" right={<Badge label="Verifying" tone="warning" />} style={{ backgroundColor: colors.warningSoft, borderColor: '#FDE68A' }}>
          <Row label="Fee" value={submitted.feeTitle} />
          <Row label="Amount" value={rupees(submitted.amount)} />
          <Row label="Mode" value={submitted.paymentMode} />
          <Row label="Reference" value={submitted.referenceNo} />
          <Row label="Paid on" value={formatDate(submitted.paidOn)} last />
          <Text style={[styles.muted, { marginTop: 10 }]}>
            The school office will check this payment. Once approved it shows as paid, with a receipt.
          </Text>
        </Card>
      </Screen>
    );
  }

  const referenceLabel = mode === 'Cheque' || mode === 'DD' ? `${mode} number` : 'Transaction / UTR number';

  return (
    <Screen footer={<Button title="Submit deposit" icon="send-outline" onPress={submit} loading={saving} disabled={!due || payable === 0} />}>
      <Loaded state={state}>
        {([, , metaData]) =>
          !due ? (
            <Text style={styles.muted}>This fee could not be found.</Text>
          ) : (
            <>
              <Card title={due.title}>
                <Row label="Student" value={`${due.studentName} (${due.className})`} />
                <Row label="Pending" value={rupees(due.pending)} />
                {verifying > 0 ? <Row label="Awaiting verification" value={rupees(verifying)} /> : null}
                <Row label="Due date" value={formatDate(due.dueDate)} last />
              </Card>

              <Card style={{ backgroundColor: colors.infoSoft, borderColor: '#BFDBFE' }}>
                <Text style={[styles.body, { color: colors.info }]}>{metaData.depositInstructions}</Text>
              </Card>

              <Field label="Amount paid (₹)" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
              <SectionTitle>Paid by</SectionTitle>
              <Chips options={metaData.depositModes.map((m) => ({ label: m, value: m }))} value={mode} onChange={setMode} />
              <Field label={referenceLabel} value={reference} onChangeText={setReference} placeholder="e.g. 4521 8890 1123" autoCapitalize="characters" />
              <SectionTitle>Paid on</SectionTitle>
              <Chips
                options={[
                  { label: 'Today', value: todayIso() },
                  { label: 'Yesterday', value: daysAgoIso(1) },
                  { label: formatDate(daysAgoIso(2)), value: daysAgoIso(2) },
                  { label: formatDate(daysAgoIso(3)), value: daysAgoIso(3) },
                ]}
                value={paidOn}
                onChange={setPaidOn}
              />
              <Field label="Note for the office (optional)" value={note} onChangeText={setNote} placeholder="e.g. paid from father's account" />
              {error ? <ErrorBox error={error} /> : null}
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}
