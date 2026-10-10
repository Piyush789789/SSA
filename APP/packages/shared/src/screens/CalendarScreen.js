import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { api } from '../api';
import { addDaysIso, formatDate, mondayIndex, todayIso } from '../format';
import { colors, tones } from '../theme';
import { useApi } from '../useApi';
import { Badge, Button, Card, Chips, Empty, ErrorBox, Field, Loaded, Screen, SectionTitle, styles } from '../ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TYPE_LOOK = {
  HOLIDAY: { ...tones.danger, label: 'Holiday' },
  EVENT: { ...tones.info, label: 'Event' },
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Holidays (red) and events (blue), a month at a time: a month grid plus the list of entries.
 * With `canEdit` (Admin app) entries can be added, edited and deleted.
 */
export function CalendarScreen({ canEdit = false }) {
  const today = todayIso();
  const [month, setMonth] = useState(today.slice(0, 7)); // "YYYY-MM"
  const [editing, setEditing] = useState(null); // null, 'new', or an entry

  const from = `${month}-01`;
  const to = lastDayOf(month);
  const state = useApi(`/calendar?from=${from}&to=${to}`);

  if (editing) {
    return (
      <CalendarEntryForm
        entry={editing === 'new' ? null : editing}
        defaultDate={month === today.slice(0, 7) ? today : from}
        onDone={() => {
          setEditing(null);
          state.reload();
        }}
      />
    );
  }

  const [year, monthNumber] = month.split('-').map(Number);

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={canEdit ? <Button title="Add holiday or event" icon="add-circle-outline" onPress={() => setEditing('new')} /> : null}
    >
      <View style={[styles.stepper, { marginBottom: 12 }]}>
        <Pressable onPress={() => setMonth(shiftMonth(month, -1))} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.stepperButton}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={[styles.body, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>
          {MONTHS[monthNumber - 1]} {year}
        </Text>
        <Pressable onPress={() => setMonth(shiftMonth(month, 1))} accessibilityRole="button" accessibilityLabel="Next month" style={styles.stepperButton}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Loaded state={state}>
        {(entries) => (
          <>
            <MonthGrid from={from} to={to} entries={entries} today={today} />
            <SectionTitle>{entries.length === 0 ? 'This month' : `${entries.length} in this month`}</SectionTitle>
            {entries.length === 0 ? (
              <Empty text="No holidays or events this month. Sundays are always holidays." icon="calendar-outline" />
            ) : (
              entries.map((e) => {
                const look = TYPE_LOOK[e.type] ?? TYPE_LOOK.EVENT;
                return (
                  <Card
                    key={e.id}
                    title={e.title}
                    right={<Badge label={look.label} tone={e.type === 'HOLIDAY' ? 'danger' : 'info'} />}
                    onPress={canEdit ? () => setEditing(e) : undefined}
                    style={{ borderLeftWidth: 4, borderLeftColor: look.fg }}
                  >
                    <Text style={styles.muted}>
                      {e.endDate && e.endDate !== e.startDate
                        ? `${formatDate(e.startDate)} – ${formatDate(e.endDate)}`
                        : formatDate(e.startDate)}
                    </Text>
                    {e.description ? <Text style={[styles.body, { marginTop: 6 }]}>{e.description}</Text> : null}
                    {canEdit ? <Text style={[styles.muted, styles.small, { marginTop: 6 }]}>Tap to edit or delete</Text> : null}
                  </Card>
                );
              })
            )}
          </>
        )}
      </Loaded>
    </Screen>
  );
}

/** The month as a Monday-first grid; holidays red, events blue, Sundays grey. */
function MonthGrid({ from, to, entries, today }) {
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - 62 - 36) / 7);
  const typeByDate = useMemo(() => {
    const map = {};
    for (const e of entries) {
      const end = e.endDate ?? e.startDate;
      for (let d = e.startDate < from ? from : e.startDate; d <= end && d <= to; d = addDaysIso(d, 1)) {
        // A holiday wins over an event on the same day.
        if (map[d] !== 'HOLIDAY') map[d] = e.type;
      }
    }
    return map;
  }, [entries, from, to]);

  const days = [];
  for (let d = from; d <= to; d = addDaysIso(d, 1)) days.push(d);

  return (
    <Card>
      <View style={local.grid}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={`h${i}`} style={[local.weekday, { width: cell }]}>
            {d}
          </Text>
        ))}
        {Array.from({ length: mondayIndex(from) }, (_, i) => (
          <View key={`b${i}`} style={{ width: cell, height: cell }} />
        ))}
        {days.map((date) => {
          const type = typeByDate[date];
          const sunday = mondayIndex(date) === 6;
          const look = type ? TYPE_LOOK[type] : sunday ? tones.neutral : null;
          return (
            <View
              key={date}
              style={[
                local.day,
                { width: cell, height: cell, backgroundColor: look ? look.bg : colors.card },
                date === today && { borderWidth: 2, borderColor: colors.primary },
              ]}
            >
              <Text style={[local.dayNumber, { color: look ? look.fg : colors.text }]}>{Number(date.slice(8))}</Text>
            </View>
          );
        })}
      </View>
      <View style={local.legend}>
        {[
          { label: 'Holiday', color: tones.danger.fg },
          { label: 'Event', color: tones.info.fg },
          { label: 'Sunday', color: tones.neutral.fg },
        ].map((item) => (
          <View key={item.label} style={local.legendItem}>
            <View style={[local.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.muted}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

/** Add or edit one calendar entry (admin). */
function CalendarEntryForm({ entry, defaultDate, onDone }) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [type, setType] = useState(entry?.type ?? 'HOLIDAY');
  const [startDate, setStartDate] = useState(entry?.startDate ?? defaultDate);
  const [endDate, setEndDate] = useState(entry?.endDate ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    if (!title.trim()) return setError(new Error('Enter a title.'));
    if (!ISO_DATE.test(startDate)) return setError(new Error('Start date must look like 2026-10-24.'));
    if (endDate && !ISO_DATE.test(endDate)) return setError(new Error('End date must look like 2026-10-26, or be left empty.'));
    if (endDate && endDate < startDate) return setError(new Error('The end date is before the start date.'));
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        type,
        startDate,
        endDate: endDate && endDate !== startDate ? endDate : null,
        description: description.trim() || null,
      };
      await api(entry ? `/calendar/${entry.id}` : '/calendar', { method: entry ? 'PUT' : 'POST', body });
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete entry', `Delete "${entry.title}" from the calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await api(`/calendar/${entry.id}`, { method: 'DELETE' });
            onDone();
          } catch (e) {
            setError(e);
            setSaving(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen footer={<Button title={entry ? 'Save changes' : 'Add to calendar'} icon="save-outline" onPress={save} loading={saving} />}>
      <SectionTitle right={<Button title="Cancel" variant="secondary" onPress={onDone} style={{ paddingVertical: 6 }} />}>
        {entry ? 'Edit entry' : 'New entry'}
      </SectionTitle>
      <Chips
        options={[
          { label: 'Holiday', value: 'HOLIDAY' },
          { label: 'Event', value: 'EVENT' },
        ]}
        value={type}
        onChange={setType}
      />
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Diwali break" maxLength={200} />
      <Field label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-10-24" keyboardType="numbers-and-punctuation" />
      <Field label="End date (optional, for several days)" value={endDate} onChangeText={setEndDate} placeholder="2026-10-26" keyboardType="numbers-and-punctuation" />
      <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline maxLength={2000} />
      {type === 'HOLIDAY' ? (
        <Text style={[styles.muted, { marginBottom: 12 }]}>No attendance can be marked on holidays. Upcoming entries notify everyone.</Text>
      ) : null}
      {error ? <ErrorBox error={error} /> : null}
      {entry ? <Button title="Delete entry" variant="danger" icon="trash-outline" onPress={confirmDelete} disabled={saving} /> : null}
    </Screen>
  );
}

function lastDayOf(month) {
  const [year, m] = month.split('-').map(Number);
  const days = new Date(year, m, 0).getDate();
  return `${month}-${String(days).padStart(2, '0')}`;
}

function shiftMonth(month, delta) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weekday: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  day: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 13, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
});
