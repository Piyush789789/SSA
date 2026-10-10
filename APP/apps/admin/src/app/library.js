import { Button, Chips, Empty, LoanCard, Loaded, Screen, api, formatDate, rupees, useApi, useT } from '@ssa/shared';
import { useState } from 'react';
import { Alert, View } from 'react-native';

const FILTERS = [
  { label: 'Open', value: 'open' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Returned', value: 'returned' },
];

/** Library loans: open / overdue / returned, with Return and Renew, and a reminder to overdue borrowers. */
export default function LibraryLoans() {
  const t = useT();
  const [status, setStatus] = useState('open');
  const state = useApi(`/library/issues?status=${status}`);
  const [busy, setBusy] = useState(null);
  const [reminding, setReminding] = useState(false);

  async function act(loan, action) {
    setBusy(`${loan.id}-${action}`);
    try {
      const result = await api(`/library/issues/${loan.id}/${action}`, { method: 'POST' });
      if (action === 'return') {
        Alert.alert(
          'Book returned',
          result?.fine ? `"${loan.bookTitle}" returned late. Fine: ${rupees(result.fine)}.` : `"${loan.bookTitle}" returned. No fine.`,
        );
      } else {
        Alert.alert('Renewed', result?.dueOn ? `New due date: ${formatDate(result.dueOn)}.` : 'The loan has been renewed.');
      }
      state.reload();
    } catch (e) {
      Alert.alert('Could not update', e.message);
    } finally {
      setBusy(null);
    }
  }

  function remind() {
    Alert.alert(t('Remind overdue'), 'Send a reminder to everyone with an overdue book?', [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Send'),
        onPress: async () => {
          setReminding(true);
          try {
            const result = await api('/library/remind-overdue', { method: 'POST' });
            Alert.alert('Reminders sent', `${result?.reminded ?? 0} borrower(s) reminded.`);
          } catch (e) {
            Alert.alert('Could not send', e.message);
          } finally {
            setReminding(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={<Button title="Remind overdue" icon="notifications-outline" variant="secondary" onPress={remind} loading={reminding} />}
    >
      <Chips options={FILTERS} value={status} onChange={setStatus} />
      <Loaded state={state}>
        {(loans) =>
          loans.length === 0 ? (
            <Empty text={`No ${status} loans.`} icon="library-outline" />
          ) : (
            loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} showBorrower>
                {!loan.returnedOn ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Button
                      title="Renew"
                      variant="secondary"
                      onPress={() => act(loan, 'renew')}
                      loading={busy === `${loan.id}-renew`}
                      disabled={busy != null}
                      style={{ flex: 1, paddingVertical: 8 }}
                    />
                    <Button
                      title="Return"
                      icon="return-down-back-outline"
                      onPress={() => act(loan, 'return')}
                      loading={busy === `${loan.id}-return`}
                      disabled={busy != null}
                      style={{ flex: 1, paddingVertical: 8 }}
                    />
                  </View>
                ) : null}
              </LoanCard>
            ))
          )
        }
      </Loaded>
    </Screen>
  );
}
