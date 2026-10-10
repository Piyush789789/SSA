import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, DateStepper, Empty, ErrorBox, Loaded, Screen, api, colors, styles, todayIso, useApi } from '@ssa/shared';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const SHOWN = 4;

/** Periods of absent / on-leave teachers for a date; pick a free teacher to cover each. */
export default function Substitutions() {
  const [date, setDate] = useState(todayIso());
  const state = useApi(`/substitutions/needs?date=${date}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <DateStepper value={date} onChange={setDate} />
      <Loaded state={state}>
        {(needs) => {
          if (needs.length === 0) {
            return <Empty text="No teachers are away on this day, so no periods need a substitute." icon="people-outline" />;
          }
          const covered = needs.filter((n) => n.substitution).length;
          return (
            <>
              <Text style={[styles.muted, { marginBottom: 10 }]}>
                {covered} of {needs.length} periods covered
              </Text>
              {needs.map((need) => (
                <NeedCard
                  key={`${need.className}-${need.periodId}-${need.substitution?.id ?? ''}`}
                  need={need}
                  date={date}
                  onChanged={state.reload}
                />
              ))}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

function NeedCard({ need, date, onChanged }) {
  const [showAll, setShowAll] = useState(false);
  const [choosing, setChoosing] = useState(!need.substitution);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const sub = need.substitution;

  async function assign(teacher) {
    setBusy(teacher.teacherId);
    setError(null);
    try {
      await api('/substitutions', {
        method: 'PUT',
        body: { date, className: need.className, periodId: need.periodId, substituteTeacherId: teacher.teacherId },
      });
      onChanged();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  function remove() {
    Alert.alert('Remove substitute', `Remove ${sub.substituteTeacherName} from this period?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy('remove');
          setError(null);
          try {
            await api(`/substitutions/${sub.id}`, { method: 'DELETE' });
            onChanged();
          } catch (e) {
            setError(e);
            setBusy(null);
          }
        },
      },
    ]);
  }

  const free = need.freeTeachers ?? [];
  const shown = showAll ? free : free.slice(0, SHOWN);

  return (
    <Card
      title={`${need.periodLabel} · Class ${need.className}`}
      right={sub ? <Badge label="Covered" tone="success" /> : <Badge label="Needs cover" tone="danger" />}
    >
      <Text style={styles.muted}>
        {need.startTime}–{need.endTime} · {need.subject}
        {need.room ? ` · ${need.room}` : ''}
      </Text>
      <Text style={[styles.muted, { marginTop: 2 }]}>Away: {need.teacherName}</Text>

      {sub ? (
        <View style={local.current}>
          <Ionicons name="swap-horizontal-outline" size={18} color={colors.success} />
          <Text style={[styles.body, { flex: 1, fontWeight: '600' }]}>{sub.substituteTeacherName}</Text>
          <Button title="Remove" variant="secondary" onPress={remove} loading={busy === 'remove'} disabled={!!busy} style={{ paddingVertical: 6 }} />
        </View>
      ) : null}

      {error ? (
        <View style={{ marginTop: 10 }}>
          <ErrorBox error={error} />
        </View>
      ) : null}

      {choosing ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>{sub ? 'Replace with' : 'Free teachers (best first)'}</Text>
          {free.length === 0 ? (
            <Text style={styles.muted}>No teacher is free in this period.</Text>
          ) : (
            shown.map((t) => {
              const best = t.teachesSubject || t.teachesClass;
              return (
                <Pressable
                  key={t.teacherId}
                  onPress={() => assign(t)}
                  disabled={!!busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign ${t.name}`}
                  style={({ pressed }) => [local.teacher, pressed && styles.pressed, busy && busy !== t.teacherId && { opacity: 0.5 }]}
                >
                  {best ? <Ionicons name="star" size={16} color={colors.warning} /> : <View style={{ width: 16 }} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.body, { fontWeight: '600' }]}>{t.name}</Text>
                    <Text style={styles.muted}>
                      {[t.teachesSubject && `Teaches ${need.subject}`, t.teachesClass && `Teaches ${need.className}`, `${t.periodsToday} periods today`]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Text style={[styles.body, { color: colors.primary, fontWeight: '700' }]}>{busy === t.teacherId ? '…' : 'Assign'}</Text>
                </Pressable>
              );
            })
          )}
          {free.length > SHOWN ? (
            <Button
              title={showAll ? 'Show fewer' : `Show all ${free.length} free teachers`}
              variant="secondary"
              onPress={() => setShowAll(!showAll)}
              style={{ marginTop: 6, paddingVertical: 8 }}
            />
          ) : null}
        </View>
      ) : (
        <Button title="Change substitute" variant="secondary" onPress={() => setChoosing(true)} style={{ marginTop: 10, paddingVertical: 8 }} />
      )}
    </Card>
  );
}

const local = StyleSheet.create({
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.successSoft,
  },
  teacher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
