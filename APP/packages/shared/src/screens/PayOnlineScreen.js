import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Text } from 'react-native';

import { api } from '../api';
import { API_URL } from '../config';
import { formatDate, rupees } from '../format';
import { colors } from '../theme';
import { combine, useApi } from '../useApi';
import { Button, Card, ErrorBox, Field, Loaded, Row, Screen, styles } from '../ui';

/**
 * Opens the school's hosted Razorpay checkout in the phone's browser. On iOS the promise resolves when the
 * browser is closed; on Android it resolves as soon as the browser opens, so wait for the app to come back.
 */
async function openCheckout(url) {
  const result = await WebBrowser.openBrowserAsync(url);
  if (Platform.OS === 'android' && result?.type === 'opened') {
    await new Promise((resolve) => {
      let wentAway = AppState.currentState !== 'active';
      const subscription = AppState.addEventListener('change', (next) => {
        if (next !== 'active') {
          wentAway = true;
        } else if (wentAway) {
          subscription.remove();
          resolve();
        }
      });
    });
  }
}

/**
 * Pay a fee online (UPI, card, net banking via Razorpay). Opened with ?dueId=&studentId= from the fee card,
 * which is only shown when the school has enabled online payments. Going back reloads the fees.
 */
export function PayOnlineScreen() {
  const { dueId, studentId } = useLocalSearchParams();
  const summary = useApi(`/fees/students/${studentId}/summary`);
  const deposits = useApi(`/fees/deposits?studentId=${studentId}`);
  const state = combine(summary, deposits);

  const due = summary.data?.dues.find((d) => d.id === dueId);
  const verifying = (deposits.data ?? [])
    .filter((d) => d.feeDueId === dueId && d.status === 'PENDING')
    .reduce((sum, d) => sum + d.amount, 0);
  const payable = due ? Math.max(0, due.pending - verifying) : 0;

  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [step, setStep] = useState('form'); // form | creating | browser
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  useEffect(() => {
    if (due && amount === '' && payable > 0) setAmount(String(payable));
  }, [due, amount, payable]);

  async function pay() {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError(new Error('Enter the amount to pay, in whole rupees.'));
      return;
    }
    if (value > payable) {
      setError(new Error(`You can pay at most ${rupees(payable)} for this fee.`));
      return;
    }
    setError(null);
    setStep('creating');
    try {
      const order = await api('/online-payments/orders', { method: 'POST', body: { feeDueId: dueId, amount: value } });
      setStep('browser');
      await openCheckout(`${API_URL}/online-payments/checkout/${encodeURIComponent(order.orderId)}`);
      // Back on the fees tab, which reloads when it is focused again.
      if (mounted.current) router.back();
    } catch (e) {
      if (!mounted.current) return;
      setError(e);
      setStep('form');
    }
  }

  if (step === 'browser') {
    return (
      <Screen footer={<Button title="Back to fees" variant="secondary" onPress={() => router.back()} />}>
        <Card title="Complete the payment in the browser">
          <Text style={styles.body}>
            Finish paying on the secure Razorpay page. When you return here, your fees are refreshed and a receipt
            appears in the payment history once the payment is confirmed.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          title={amount ? `Pay ${rupees(Number(amount))}` : 'Pay'}
          icon="flash-outline"
          onPress={pay}
          loading={step === 'creating'}
          disabled={!due || payable === 0}
        />
      }
    >
      <Loaded state={state}>
        {() =>
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
              <Field
                label="Amount to pay (₹)"
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
              <Card style={{ backgroundColor: colors.infoSoft, borderColor: '#BFDBFE' }}>
                <Text style={[styles.body, { color: colors.info }]}>
                  You will pay on Razorpay’s secure page (UPI, card or net banking). The receipt is issued automatically.
                </Text>
              </Card>
              {error ? <ErrorBox error={error} /> : null}
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}
