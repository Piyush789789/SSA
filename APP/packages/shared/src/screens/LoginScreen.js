import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../auth';
import { API_URL, SCHOOL_NAME } from '../config';
import { colors } from '../theme';
import { Button, ErrorBox, Field } from '../ui';

/** `demo` ({ email, password }) is shown as a hint while the app runs on demo data. */
export function LoginScreen({ appName, icon = 'school-outline', demo }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError(new Error('Enter your email and password.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name={icon} size={36} color="#fff" />
          </View>
          <Text style={styles.school}>{SCHOOL_NAME}</Text>
          <Text style={styles.title}>{appName}</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {error ? <ErrorBox error={error} /> : null}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@ssa.edu"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submit}
          />
          <Button title="Sign in" onPress={submit} loading={submitting} />

          {demo ? (
            <Text style={styles.hint}>
              Demo account: {demo.email} / {demo.password}
            </Text>
          ) : null}
          <Text style={styles.server}>Server: {API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 48 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  school: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 24 },
  hint: { marginTop: 20, fontSize: 13, color: colors.muted, textAlign: 'center' },
  server: { marginTop: 6, fontSize: 11, color: '#94A3B8', textAlign: 'center' },
});
