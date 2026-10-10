import { useState } from 'react';
import { Text } from 'react-native';

import { api } from '../api';
import { formatDate, formatDateTime } from '../format';
import { useT } from '../i18n';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Badge, Button, Card, Empty, ErrorBox, Field, InfoCard, Loaded, Row, Screen, SectionTitle, styles } from '../ui';
import { PhoneRow } from './TransportScreen';

// The fields a parent may edit; the rest of the record is kept as saved.
const EDITABLE = ['allergies', 'medications', 'conditions', 'emergencyContactName', 'emergencyContactPhone'];
const READ_ONLY = ['id', 'studentId', 'updatedBy', 'updatedAt'];

/**
 * A student's health record and sick-room visits. With `canEdit` (parent app) the family can update
 * allergies, medicines, conditions and the emergency contact.
 */
export function HealthScreen({ studentId, canEdit = false, header }) {
  const record = useApi(studentId ? `/health-records/${studentId}` : null);
  const visits = useApi(studentId ? `/health-records/${studentId}/visits` : null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);

  function reloadAll() {
    record.reload();
    visits.reload();
  }

  return (
    <Screen refreshing={record.refreshing || visits.refreshing} onRefresh={reloadAll}>
      {header}
      {message ? <InfoCard text={message} /> : null}
      <Loaded state={record}>
        {(data) => {
          const r = data ?? {};
          if (editing) {
            return (
              <HealthForm
                studentId={studentId}
                record={r}
                onCancel={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  setMessage('Health record saved.');
                  record.reload();
                }}
              />
            );
          }
          return (
            <>
              <Card title="Health record">
                <Row label="Blood group" value={r.bloodGroup} />
                <Row label="Height" value={r.heightCm != null ? `${r.heightCm} cm` : null} />
                <Row label="Weight" value={r.weightKg != null ? `${r.weightKg} kg` : null} />
                <Row label="Vision (L / R)" value={r.visionLeft || r.visionRight ? `${r.visionLeft ?? '—'} / ${r.visionRight ?? '—'}` : null} />
                <Row label="Allergies" value={r.allergies} />
                <Row label="Medications" value={r.medications} />
                <Row label="Conditions" value={r.conditions} />
                <Row label="Family doctor" value={r.familyDoctor} />
                <Row label="Last check-up" value={r.lastCheckupDate ? formatDate(r.lastCheckupDate) : null} last />
                {r.updatedAt ? (
                  <Text style={[styles.muted, styles.small, { marginTop: 6 }]}>
                    Updated {formatDateTime(r.updatedAt)}
                    {r.updatedBy ? ` by ${r.updatedBy}` : ''}
                  </Text>
                ) : null}
              </Card>
              <Card title="Emergency contact">
                {r.emergencyContactName || r.emergencyContactPhone ? (
                  <PhoneRow role="Contact" name={r.emergencyContactName} phone={r.emergencyContactPhone} last />
                ) : (
                  <Text style={styles.muted}>Not added yet.</Text>
                )}
              </Card>
              {canEdit ? (
                <Button
                  title="Edit"
                  icon="create-outline"
                  variant="secondary"
                  onPress={() => {
                    setMessage(null);
                    setEditing(true);
                  }}
                  style={{ marginBottom: 12 }}
                />
              ) : null}
            </>
          );
        }}
      </Loaded>

      <SectionTitle>Sick-room visits</SectionTitle>
      <Loaded state={visits}>{(list) => <VisitList visits={list ?? []} />}</Loaded>
    </Screen>
  );
}

/** Sick-room visits, newest first. */
export function VisitList({ visits }) {
  if (visits.length === 0) return <Empty text="No sick-room visits recorded." icon="medkit-outline" />;
  return visits.map((v) => (
    <Card
      key={v.id}
      title={formatDateTime(v.at)}
      right={v.sentHome ? <Badge label="Sent home" tone="danger" /> : <Badge label="Back to class" tone="success" />}
    >
      <Text style={styles.body}>{v.complaint}</Text>
      {v.actionTaken ? <Text style={[styles.muted, { marginTop: 4 }]}>Action: {v.actionTaken}</Text> : null}
      {v.recordedBy ? <Text style={[styles.muted, styles.small, { marginTop: 4 }]}>Recorded by {v.recordedBy}</Text> : null}
    </Card>
  ));
}

function HealthForm({ studentId, record, onCancel, onSaved }) {
  const t = useT();
  const [values, setValues] = useState(() => Object.fromEntries(EDITABLE.map((k) => [k, record[k] ?? ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (text) => setValues((v) => ({ ...v, [key]: text }));

  async function save() {
    const phone = values.emergencyContactPhone.trim();
    if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) {
      setError(new Error('Enter a valid phone number for the emergency contact.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { ...record };
      READ_ONLY.forEach((k) => delete body[k]);
      EDITABLE.forEach((k) => {
        body[k] = values[k].trim() || null;
      });
      await api(`/health-records/${studentId}`, { method: 'PUT', body });
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Health record">
      <Field label="Allergies" value={values.allergies} onChangeText={set('allergies')} multiline maxLength={1000} placeholder="e.g. Peanuts, dust" />
      <Field label="Medications" value={values.medications} onChangeText={set('medications')} multiline maxLength={1000} placeholder="Medicines taken regularly" />
      <Field label="Conditions" value={values.conditions} onChangeText={set('conditions')} multiline maxLength={1000} placeholder="e.g. Asthma" />
      <Field label="Emergency contact name" value={values.emergencyContactName} onChangeText={set('emergencyContactName')} maxLength={120} />
      <Field
        label="Emergency contact phone"
        value={values.emergencyContactPhone}
        onChangeText={set('emergencyContactPhone')}
        keyboardType="phone-pad"
        maxLength={20}
      />
      {error ? <ErrorBox error={error} /> : null}
      <Text style={[styles.muted, { marginBottom: 10, color: colors.muted }]}>{t('Other details are updated by the school.')}</Text>
      <Button title="Save health record" icon="save-outline" onPress={save} loading={saving} style={{ marginBottom: 8 }} />
      <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={saving} />
    </Card>
  );
}
