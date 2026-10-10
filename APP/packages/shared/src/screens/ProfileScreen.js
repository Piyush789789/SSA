import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useAuth } from '../auth';
import { capitalize, formatDate } from '../format';
import { useT } from '../i18n';
import { Button, Card, LanguageSwitch, Row, Screen } from '../ui';

export function ProfileScreen() {
  const { user, profile, children, role, signOut } = useAuth();
  const t = useT();

  function confirmSignOut() {
    Alert.alert(t('Sign out'), t('Do you want to sign out of this app?'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Sign out'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <Screen>
      <Card title={user?.name}>
        <Row label="Email" value={user?.email} />
        <Row label="Role" value={capitalize(role)} last={!profile} />
        {role === 'STUDENT' && profile ? <StudentDetails student={profile} /> : null}
        {role === 'TEACHER' && profile ? (
          <>
            <Row label="Teacher ID" value={profile.id} />
            <Row label="Subjects" value={profile.subjects.join(', ')} />
            <Row label="Classes" value={profile.assignedClasses.join(', ')} />
            <Row label="Qualification" value={profile.qualification} />
            <Row label="Phone" value={profile.phone} last />
          </>
        ) : null}
        {role === 'PARENT' && profile ? (
          <>
            <Row label="Phone" value={profile.phone} />
            <Row label="Children" value={children.map((c) => `${c.name} (${c.className})`).join('\n')} last />
          </>
        ) : null}
      </Card>
      <LanguageSwitch />
      <Button
        title="Change password"
        variant="secondary"
        icon="key-outline"
        onPress={() => router.push('/change-password')}
        style={{ marginBottom: 10 }}
      />
      <Button title="Sign out" variant="danger" icon="log-out-outline" onPress={confirmSignOut} />
    </Screen>
  );
}

function StudentDetails({ student }) {
  return (
    <>
      <Row label="Student ID" value={student.id} />
      <Row label="Class" value={student.className} />
      <Row label="Roll number" value={student.rollNumber} />
      <Row label="Date of birth" value={formatDate(student.dateOfBirth)} />
      <Row label="Blood group" value={student.bloodGroup} />
      <Row label="Guardian" value={student.guardian ? `${student.guardian.name} (${student.guardian.relation})` : null} />
      <Row label="Guardian phone" value={student.guardian?.phone} last />
    </>
  );
}
