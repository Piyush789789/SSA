import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../api';
import { formatDate, todayIso, weekdayOf } from '../format';
import { useT } from '../i18n';
import { colors } from '../theme';
import { useApi } from '../useApi';
import {
  Badge,
  Button,
  Card,
  Chips,
  DateStepper,
  Empty,
  ErrorBox,
  Field,
  InfoCard,
  Loaded,
  Screen,
  SectionTitle,
  Stat,
  StatGrid,
  styles,
} from '../ui';

const hhmm = (time) => String(time ?? '').slice(0, 5);
const slotTime = (slot) => `${hhmm(slot.startTime)}–${hhmm(slot.endTime)}`;
const dayLabel = (date) => `${weekdayOf(date).slice(0, 3)}, ${formatDate(date)}`;
const byTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

function groupBy(items, keyOf) {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()];
}

function cancelBooking(slot, t, onDone, who = 'this booking') {
  Alert.alert(t('Cancel booking'), `Cancel ${who} on ${formatDate(slot.date)} at ${hhmm(slot.startTime)}?`, [
    { text: t('Back'), style: 'cancel' },
    {
      text: t('Cancel booking'),
      style: 'destructive',
      onPress: async () => {
        try {
          await api(`/ptm/slots/${slot.id}/booking`, { method: 'DELETE' });
          onDone();
        } catch (e) {
          Alert.alert('Could not cancel', e.message);
        }
      },
    },
  ]);
}

// ---------------------------------------------------------------- parent

/** Parent: free slots of the children's teachers grouped by teacher and date, plus the family's bookings. */
export function PtmBookingScreen({ studentId, studentName, header }) {
  const t = useT();
  const state = useApi(`/ptm/slots?from=${todayIso()}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  function book(slot) {
    Alert.alert(
      t('Book'),
      `Meet ${slot.teacherName} on ${dayLabel(slot.date)} at ${hhmm(slot.startTime)}${studentName ? ` about ${studentName}` : ''}?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Book'),
          onPress: async () => {
            setBusy(slot.id);
            setMessage(null);
            try {
              await api(`/ptm/slots/${slot.id}/book`, { method: 'POST', body: { studentId, note: note.trim() || null } });
              setNote('');
              setMessage(`Booked with ${slot.teacherName} on ${formatDate(slot.date)} at ${hhmm(slot.startTime)}.`);
              state.reload();
            } catch (e) {
              Alert.alert('Could not book', e.message);
              state.reload();
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      {message ? <InfoCard text={message} /> : null}
      <Loaded state={state}>
        {(slots) => {
          const sorted = [...slots].sort(byTime);
          const mine = sorted.filter((s) => s.parentId);
          const free = sorted.filter((s) => !s.parentId);
          return (
            <>
              <SectionTitle>My bookings</SectionTitle>
              {mine.length === 0 ? (
                <Empty text="No meetings booked." icon="people-outline" />
              ) : (
                mine.map((slot) => (
                  <Card key={slot.id} title={slot.teacherName} right={<Badge label={slotTime(slot)} tone="success" />}>
                    <Text style={styles.body}>
                      {dayLabel(slot.date)}
                      {slot.location ? ` · ${slot.location}` : ''}
                    </Text>
                    <Text style={styles.muted}>
                      {slot.title}
                      {slot.studentName ? ` · for ${slot.studentName}` : ''}
                    </Text>
                    {slot.parentNote ? <Text style={[styles.muted, { marginTop: 4 }]}>Note: “{slot.parentNote}”</Text> : null}
                    <Button
                      title="Cancel booking"
                      variant="secondary"
                      onPress={() => cancelBooking(slot, t, state.reload)}
                      style={{ marginTop: 10, paddingVertical: 8 }}
                    />
                  </Card>
                ))
              )}

              <SectionTitle>Free slots</SectionTitle>
              {free.length === 0 ? (
                <Empty text="No free meeting slots right now. Teachers will announce new ones." icon="calendar-outline" />
              ) : (
                <>
                  <Field
                    label="Note for the teacher (optional)"
                    value={note}
                    onChangeText={setNote}
                    placeholder="e.g. Want to discuss maths progress"
                    maxLength={500}
                  />
                  {groupBy(free, (s) => s.teacherName).map(([teacher, teacherSlots]) => (
                    <Card key={teacher} title={teacher}>
                      {groupBy(teacherSlots, (s) => s.date).map(([date, daySlots]) => (
                        <View key={date} style={{ marginBottom: 8 }}>
                          <Text style={[styles.muted, { fontWeight: '700', marginBottom: 6 }]}>
                            {dayLabel(date)}
                            {daySlots[0].location ? ` · ${daySlots[0].location}` : ''}
                          </Text>
                          <View style={local.slots}>
                            {daySlots.map((slot) => (
                              <Pressable
                                key={slot.id}
                                onPress={() => book(slot)}
                                disabled={busy != null}
                                accessibilityRole="button"
                                accessibilityLabel={`Book ${hhmm(slot.startTime)}`}
                                style={({ pressed }) => [local.slot, pressed && styles.pressed, busy === slot.id && { opacity: 0.5 }]}
                              >
                                <Text style={local.slotText}>{hhmm(slot.startTime)}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ))}
                    </Card>
                  ))}
                </>
              )}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

// ---------------------------------------------------------------- teacher

const MINUTES = [10, 15, 20, 30].map((m) => ({ label: `${m} min`, value: m }));
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Teacher: create meeting slots for a day and see the bookings grouped by date. */
export function PtmTeacherScreen() {
  const t = useT();
  const state = useApi(`/ptm/slots?from=${todayIso()}`);
  const [title, setTitle] = useState('Parent-teacher meeting');
  const [date, setDate] = useState(todayIso());
  const [from, setFrom] = useState('10:00');
  const [to, setTo] = useState('12:00');
  const [minutes, setMinutes] = useState(15);
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function create() {
    if (!title.trim()) return setError(new Error('Enter a title.'));
    if (!TIME.test(from) || !TIME.test(to)) return setError(new Error('Enter times as HH:mm, e.g. 10:00.'));
    if (from >= to) return setError(new Error('The end time must be after the start time.'));
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await api('/ptm/slots', {
        method: 'POST',
        body: { title: title.trim(), date, from, to, minutes, location: location.trim() || null },
      });
      const n = Array.isArray(created) ? created.length : null;
      setMessage(`${n != null ? `${n} slots` : 'Slots'} created for ${formatDate(date)}. Families of your classes have been notified.`);
      setShowForm(false);
      state.reload();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  function slotActions(slot) {
    const booked = Boolean(slot.parentId);
    const remove = {
      text: t('Delete slot'),
      style: 'destructive',
      onPress: async () => {
        try {
          await api(`/ptm/slots/${slot.id}`, { method: 'DELETE' });
          state.reload();
        } catch (e) {
          Alert.alert('Could not delete', e.message);
        }
      },
    };
    Alert.alert(
      `${formatDate(slot.date)} · ${slotTime(slot)}`,
      booked ? `Booked by ${slot.parentName ?? 'a parent'} for ${slot.studentName}. The family will be notified.` : 'This slot is free.',
      [
        { text: t('Back'), style: 'cancel' },
        ...(booked ? [{ text: t('Cancel booking'), onPress: () => cancelBooking(slot, t, state.reload, `the booking of ${slot.studentName}`) }] : []),
        remove,
      ],
    );
  }

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={showForm ? null : <Button title="Create slots" icon="add-circle-outline" onPress={() => setShowForm(true)} />}
    >
      {message ? <InfoCard text={message} /> : null}
      {showForm ? (
        <Card title="Create slots">
          <Field label="Title" value={title} onChangeText={setTitle} maxLength={200} />
          <DateStepper label="Date" value={date} onChange={setDate} min={todayIso()} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="From" value={from} onChangeText={setFrom} placeholder="10:00" maxLength={5} keyboardType="numbers-and-punctuation" style={{ flex: 1 }} />
            <Field label="To" value={to} onChangeText={setTo} placeholder="12:00" maxLength={5} keyboardType="numbers-and-punctuation" style={{ flex: 1 }} />
          </View>
          <Text style={styles.label}>{t('Minutes per meeting')}</Text>
          <Chips options={MINUTES} value={minutes} onChange={setMinutes} />
          <Field label="Location (optional)" value={location} onChangeText={setLocation} placeholder="e.g. Room 12" maxLength={120} />
          {error ? <ErrorBox error={error} /> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Cancel" variant="secondary" onPress={() => setShowForm(false)} disabled={saving} style={{ flex: 1 }} />
            <Button title="Create slots" icon="checkmark" onPress={create} loading={saving} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <SectionTitle>Bookings by date</SectionTitle>
      <Loaded state={state}>
        {(slots) =>
          slots.length === 0 ? (
            <Empty text="No upcoming meeting slots. Create some for parents to book." icon="calendar-outline" />
          ) : (
            groupBy([...slots].sort(byTime), (s) => s.date).map(([day, daySlots]) => {
              const booked = daySlots.filter((s) => s.parentId).length;
              return (
                <Card key={day} title={dayLabel(day)} right={<Badge label={`${booked}/${daySlots.length} booked`} tone={booked ? 'success' : 'neutral'} />}>
                  {daySlots.map((slot, i) => (
                    <SlotRow key={slot.id} slot={slot} last={i === daySlots.length - 1} onPress={() => slotActions(slot)} />
                  ))}
                </Card>
              );
            })
          )
        }
      </Loaded>
    </Screen>
  );
}

function SlotRow({ slot, last, onPress, showTeacher = false }) {
  const booked = Boolean(slot.parentId);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, { alignItems: 'center' }, last && { borderBottomWidth: 0 }, pressed && styles.pressed]}
    >
      <Text style={[styles.body, { fontWeight: '700', width: 52 }]}>{hhmm(slot.startTime)}</Text>
      <View style={{ flex: 1 }}>
        {showTeacher ? <Text style={[styles.body, { fontWeight: '600' }]}>{slot.teacherName}</Text> : null}
        {booked ? (
          <>
            <Text style={styles.body}>
              {slot.studentName}
              {slot.className ? ` (${slot.className})` : ''}
            </Text>
            <Text style={styles.muted}>{slot.parentName}</Text>
            {slot.parentNote ? <Text style={styles.muted}>“{slot.parentNote}”</Text> : null}
          </>
        ) : (
          <Text style={styles.muted}>Free</Text>
        )}
      </View>
      <Badge label={booked ? 'Booked' : 'Free'} tone={booked ? 'success' : 'neutral'} />
    </Pressable>
  );
}

// ---------------------------------------------------------------- admin

const ADMIN_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Booked', value: 'booked' },
  { label: 'Free', value: 'free' },
];

/** Admin: every upcoming PTM slot by date and teacher, with counts; a booking can be cancelled. */
export function PtmOverviewScreen() {
  const t = useT();
  const state = useApi(`/ptm/slots?from=${todayIso()}`);
  const [filter, setFilter] = useState('all');

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Loaded state={state}>
        {(slots) => {
          const booked = slots.filter((s) => s.parentId).length;
          const teachers = new Set(slots.map((s) => s.teacherId)).size;
          const shown = [...slots]
            .filter((s) => (filter === 'all' ? true : filter === 'booked' ? s.parentId : !s.parentId))
            .sort((a, b) => byTime(a, b) || String(a.teacherName).localeCompare(String(b.teacherName)));
          return (
            <>
              <StatGrid>
                <Stat label="Upcoming slots" value={slots.length} icon="calendar-outline" tone="primary" />
                <Stat label="Booked" value={booked} icon="checkmark-done-outline" tone="success" />
                <Stat label="Free" value={slots.length - booked} icon="time-outline" tone="info" />
                <Stat label="Teachers" value={teachers} icon="easel-outline" />
              </StatGrid>
              <Chips options={ADMIN_FILTERS} value={filter} onChange={setFilter} />
              {shown.length === 0 ? (
                <Empty text="No upcoming meeting slots." icon="calendar-outline" />
              ) : (
                groupBy(shown, (s) => s.date).map(([day, daySlots]) => (
                  <View key={day}>
                    <SectionTitle>{dayLabel(day)}</SectionTitle>
                    {groupBy(daySlots, (s) => s.teacherName).map(([teacher, teacherSlots]) => (
                      <Card key={teacher} title={teacher} right={<Badge label={`${teacherSlots.filter((s) => s.parentId).length}/${teacherSlots.length}`} tone="info" />}>
                        {teacherSlots.map((slot, i) => (
                          <SlotRow
                            key={slot.id}
                            slot={slot}
                            last={i === teacherSlots.length - 1}
                            onPress={slot.parentId ? () => cancelBooking(slot, t, state.reload, `the booking of ${slot.studentName}`) : null}
                          />
                        ))}
                      </Card>
                    ))}
                  </View>
                ))
              )}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

const local = StyleSheet.create({
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  slotText: { color: colors.primaryDark, fontWeight: '700' },
});
