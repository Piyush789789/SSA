import {
  AttendanceScreen,
  Card,
  Chips,
  FeesScreen,
  Loaded,
  ResultsScreen,
  Row,
  Screen,
  formatDate,
  useApi,
} from '@ssa/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

const SECTIONS = [
  { label: 'Profile', value: 'profile' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Results', value: 'results' },
  { label: 'Fees', value: 'fees' },
];

export default function StudentDetail() {
  const { id } = useLocalSearchParams();
  const [section, setSection] = useState('profile');
  const state = useApi(`/students/${id}`);
  const header = <Chips options={SECTIONS} value={section} onChange={setSection} />;

  return (
    <>
      <Stack.Screen options={{ title: state.data?.name ?? 'Student' }} />
      {section === 'attendance' ? <AttendanceScreen studentId={id} header={header} /> : null}
      {section === 'results' ? <ResultsScreen studentId={id} header={header} /> : null}
      {section === 'fees' ? <FeesScreen studentId={id} header={header} /> : null}
      {section === 'profile' ? (
        <Screen refreshing={state.refreshing} onRefresh={state.reload}>
          {header}
          <Loaded state={state}>
            {(s) => (
              <>
                <Card title={s.name}>
                  <Row label="Student ID" value={s.id} />
                  <Row label="Class" value={s.className} />
                  <Row label="Roll number" value={s.rollNumber} />
                  <Row label="Gender" value={s.gender} />
                  <Row label="Date of birth" value={formatDate(s.dateOfBirth)} />
                  <Row label="Blood group" value={s.bloodGroup} />
                  <Row label="Email" value={s.email} />
                  <Row label="Address" value={s.address} />
                  <Row label="Admitted" value={formatDate(s.admissionDate)} last />
                </Card>
                {s.guardian ? (
                  <Card title="Guardian">
                    <Row label="Name" value={s.guardian.name} />
                    <Row label="Relation" value={s.guardian.relation} />
                    <Row label="Phone" value={s.guardian.phone} />
                    <Row label="Email" value={s.guardian.email} last />
                  </Card>
                ) : null}
              </>
            )}
          </Loaded>
        </Screen>
      ) : null}
    </>
  );
}
