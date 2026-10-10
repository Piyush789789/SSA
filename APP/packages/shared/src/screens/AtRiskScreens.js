import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { percent, rupees } from '../format';
import { useT } from '../i18n';
import { useApi } from '../useApi';
import { Badge, Card, Chips, Empty, ListItem, Loaded, Screen, styles } from '../ui';

function scoreTone(score) {
  if (score == null) return 'neutral';
  if (score >= 60) return 'danger';
  return score >= 30 ? 'warning' : 'info';
}

/** One at-risk student with reason chips and the numbers behind them. */
export function AtRiskCard({ student, onPress }) {
  const s = student;
  const facts = [
    s.attendanceRate != null ? `Attendance ${percent(s.attendanceRate)}` : null,
    s.averageMarks != null ? `Marks ${percent(s.averageMarks)}` : null,
    s.overdueFees ? `Overdue ${rupees(s.overdueFees)}` : null,
    s.missingHomework ? `${s.missingHomework} homework missing` : null,
  ].filter(Boolean);
  return (
    <Card
      title={s.name}
      right={s.score != null ? <Badge label={`Risk ${s.score}`} tone={scoreTone(s.score)} /> : null}
      onPress={onPress}
    >
      <Text style={styles.muted}>
        Class {s.className}
        {s.rollNumber != null ? ` · Roll ${s.rollNumber}` : ''}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {(s.reasons ?? []).map((reason) => (
          <Badge key={reason} label={reason} tone="warning" />
        ))}
      </View>
      {facts.length ? <Text style={[styles.muted, styles.small, { marginTop: 8 }]}>{facts.join(' · ')}</Text> : null}
    </Card>
  );
}

/**
 * Students needing attention, most urgent first. `classes` (ids) fills the class filter; `onOpen(student)`
 * makes cards tappable (admin opens the student's profile).
 */
export function AtRiskScreen({ classes = [], onOpen }) {
  const [className, setClassName] = useState('ALL');
  const state = useApi(className === 'ALL' ? '/insights/at-risk' : `/insights/at-risk?className=${encodeURIComponent(className)}`);
  const options = [{ label: 'All', value: 'ALL' }, ...classes.map((c) => ({ label: c, value: c }))];

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {classes.length > 1 ? <Chips options={options} value={className} onChange={setClassName} /> : null}
      <Loaded state={state}>
        {(list) =>
          list.length === 0 ? (
            <Empty text="No students need attention right now." icon="happy-outline" />
          ) : (
            <>
              <Text style={[styles.muted, { marginBottom: 10 }]}>
                {list.length} student{list.length === 1 ? '' : 's'} · based on attendance, marks, overdue fees and missing homework
              </Text>
              {list.map((s) => (
                <AtRiskCard key={s.studentId} student={s} onPress={onOpen ? () => onOpen(s) : undefined} />
              ))}
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}

/** Dashboard card: "Students needing attention (n)" with the top three; taps open the full list at /at-risk. */
export function AtRiskSummary({ limit = 3 }) {
  const t = useT();
  const state = useApi('/insights/at-risk');
  if (state.loading || (state.error && state.data == null)) return null; // the dashboard stays usable without it
  const list = state.data ?? [];
  return (
    <Card
      title={`${t('Students needing attention')} (${list.length})`}
      right={list.length ? <Badge label={t('View all')} tone="primary" /> : null}
      onPress={() => router.push('/at-risk')}
    >
      {list.length === 0 ? (
        <Text style={styles.muted}>No students need attention right now.</Text>
      ) : (
        list.slice(0, limit).map((s) => (
          <ListItem
            key={s.studentId}
            icon="alert-circle-outline"
            title={s.name}
            subtitle={`Class ${s.className} · ${(s.reasons ?? []).slice(0, 2).join(', ')}`}
          />
        ))
      )}
    </Card>
  );
}
