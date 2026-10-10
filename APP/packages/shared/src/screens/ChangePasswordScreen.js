import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { api } from '../api';
import { useAuth } from '../auth';
import { colors } from '../theme';
import { Button, Card, ErrorBox, Field, Screen, styles } from '../ui';

/**
 * Change your password. Shown on its own after signing in with a temporary password from the school
 * office (the app cannot be used until it is replaced), and from the Profile screen otherwise.
 */
export function ChangePasswordScreen() {
  const { user, refreshSession, signOut } = useAuth();
  const forced = Boolean(user?.mustChangePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      setError(new Error('Use at least 8 characters with both letters and numbers.'));
      return;
    }
    if (next !== confirm) {
      setError(new Error('The two new passwords do not match.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      await refreshSession(); // clears mustChangePassword, which opens the app
      if (!forced) setDone(true);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Screen footer={<Button title="Done" onPress={() => router.back()} />}>
        <Card style={{ backgroundColor: colors.successSoft, borderColor: '#A7F3D0' }}>
          <Text style={[styles.body, { color: colors.success }]}>Your password has been changed.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title={forced ? 'Save and continue' : 'Change password'} icon="key-outline" onPress={save} loading={saving} />}>
      {forced ? (
        <Card title="Set your own password">
          <Text style={styles.muted}>
            You signed in with a temporary password from the school office. Choose a new password to continue.
          </Text>
        </Card>
      ) : null}
      <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" />
      <Field label="New password" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" />
      <Field label="Repeat new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
      <Text style={[styles.muted, { marginBottom: 12 }]}>At least 8 characters, with both letters and numbers.</Text>
      {error ? <ErrorBox error={error} /> : null}
      {forced ? <Button title="Sign out" variant="secondary" onPress={() => signOut()} /> : null}
    </Screen>
  );
}
