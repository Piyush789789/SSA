import { Text } from 'react-native';

import { formatDate } from '../format';
import { useApi } from '../useApi';
import { Badge, Card, Empty, Loaded, Row, Screen, styles } from '../ui';

const TITLES = { TC: 'Transfer Certificate', BONAFIDE: 'Bonafide Certificate' };

/** Certificates the school issued to a student (read-only; printed copies come from the school office). */
export function CertificatesScreen({ studentId, header }) {
  const state = useApi(`/students/${studentId}/certificates`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(list) =>
          list.length === 0 ? (
            <Empty text="No certificates issued yet. Ask the school office if you need a bonafide or transfer certificate." icon="document-outline" />
          ) : (
            <>
              {list.map((c) => (
                <Card key={c.id} title={TITLES[c.type] ?? c.type} right={<Badge label={c.type} tone={c.type === 'TC' ? 'warning' : 'info'} />}>
                  <Row label="Serial no." value={c.id} />
                  <Row label="Issued on" value={formatDate(c.issuedOn)} />
                  <Row label="Academic year" value={c.academicYear} />
                  <Row label="Class" value={c.className} last={!c.leavingDate && !c.reason && !c.conduct} />
                  {c.leavingDate ? <Row label="Leaving date" value={formatDate(c.leavingDate)} last={!c.reason && !c.conduct} /> : null}
                  {c.reason ? <Row label="Reason" value={c.reason} last={!c.conduct} /> : null}
                  {c.conduct ? <Row label="Conduct" value={c.conduct} last /> : null}
                  {c.remarks ? <Text style={[styles.muted, { marginTop: 8 }]}>{c.remarks}</Text> : null}
                </Card>
              ))}
              <Text style={[styles.muted, { textAlign: 'center' }]}>Printed copies are issued by the school office.</Text>
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}
