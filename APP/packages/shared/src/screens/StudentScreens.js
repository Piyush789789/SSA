import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  addDaysIso,
  capitalize,
  dateParts,
  daysAgoIso,
  formatDate,
  formatDateTime,
  mondayIndex,
  nowHHmm,
  percent,
  rupees,
  todayIso,
  weekdayOf,
} from '../format';
import { colors, tones } from '../theme';
import { combine, useApi } from '../useApi';
import { Badge, Button, Card, Chips, Empty, Loaded, Row, Screen, SectionTitle, Stat, StatGrid, styles } from '../ui';

// Screens about one student, shared by the Student app (their own data) and the Parent app (a child's).
// `header` lets the Parent app put its child switcher on top.

// ---------------------------------------------------------------- attendance

const CALENDAR_DAYS = 30;

const STATUS_STYLE = {
  present: { ...tones.success, label: 'Present' },
  absent: { ...tones.danger, label: 'Absent' },
  late: { ...tones.warning, label: 'Late' },
  leave: { ...tones.info, label: 'Leave' },
  holiday: { ...tones.neutral, label: 'Holiday / Sunday' },
};

export function AttendanceScreen({ studentId, header }) {
  const from = daysAgoIso(CALENDAR_DAYS - 1);
  const stats = useApi(`/attendance/students/${studentId}/stats`);
  const records = useApi(`/attendance?studentId=${studentId}&from=${from}`);
  const state = combine(stats, records);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {([summary, list]) => (
          <>
            <StatGrid>
              <Stat label="Attendance rate" value={percent(summary.rate)} tone={rateTone(summary.rate)} icon="pie-chart-outline" />
              <Stat label="Days present" value={summary.present} tone="success" icon="checkmark-circle-outline" />
              <Stat label="Days absent" value={summary.absent} tone="danger" icon="close-circle-outline" />
              <Stat label="Late / leave" value={`${summary.late} / ${summary.leave}`} tone="warning" icon="time-outline" />
            </StatGrid>
            <SectionTitle>Last {CALENDAR_DAYS} days</SectionTitle>
            <AttendanceCalendar records={list} from={from} />
          </>
        )}
      </Loaded>
    </Screen>
  );
}

/** One square per day for the last 30 days, Monday to Sunday, coloured by status. Tap a day for details. */
function AttendanceCalendar({ records, from }) {
  const { width } = useWindowDimensions();
  const today = todayIso();
  const [selected, setSelected] = useState(today);
  const byDate = useMemo(() => Object.fromEntries(records.map((r) => [r.date, r])), [records]);

  // Screen padding (16 + 16) + card padding and border (15 + 15) + six gaps of 6.
  const cell = Math.floor((width - 62 - 36) / 7);
  const days = [];
  for (let d = from; d <= today; d = addDaysIso(d, 1)) days.push(d);
  const blanks = mondayIndex(from);

  const statusOf = (date) => byDate[date]?.status ?? (mondayIndex(date) === 6 ? 'holiday' : null);
  const selectedRecord = byDate[selected];
  const selectedStatus = statusOf(selected);

  return (
    <Card>
      <View style={local.grid}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={`h${i}`} style={[local.weekday, { width: cell }]}>
            {d}
          </Text>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <View key={`b${i}`} style={{ width: cell, height: cell }} />
        ))}
        {days.map((date) => {
          const status = statusOf(date);
          const look = STATUS_STYLE[status];
          const isSelected = date === selected;
          return (
            <Pressable
              key={date}
              onPress={() => setSelected(date)}
              accessibilityRole="button"
              accessibilityLabel={`${formatDate(date)}: ${look?.label ?? 'Not marked'}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                local.day,
                { width: cell, height: cell, backgroundColor: look ? look.bg : colors.card },
                !look && { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
                isSelected && { borderWidth: 2, borderColor: colors.text, borderStyle: 'solid' },
              ]}
            >
              <Text style={[local.dayNumber, { color: look ? look.fg : colors.muted }]}>{dateParts(date).day}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={local.detail}>
        <Text style={[styles.body, { fontWeight: '700' }]}>
          {weekdayOf(selected)}, {formatDate(selected)}
        </Text>
        <Text style={styles.muted}>
          {STATUS_STYLE[selectedStatus]?.label ?? 'Not marked yet'}
          {selectedRecord?.checkInTime ? ` · in at ${selectedRecord.checkInTime}` : ''}
          {selectedRecord?.remarks ? ` · ${selectedRecord.remarks}` : ''}
        </Text>
      </View>

      <View style={local.legend}>
        {['present', 'absent', 'late', 'leave', 'holiday'].map((s) => (
          <View key={s} style={local.legendItem}>
            <View style={[local.legendDot, { backgroundColor: STATUS_STYLE[s].fg }]} />
            <Text style={styles.muted}>{STATUS_STYLE[s].label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------- results

export function ResultsScreen({ studentId, header }) {
  const state = useApi(`/results/students/${studentId}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(result) => {
          if (result.subjects.length === 0) {
            return <Empty text="No published results yet." icon="ribbon-outline" />;
          }
          const byExam = groupBy(result.subjects, (s) => s.examName);
          return (
            <>
              <StatGrid>
                <Stat label="Overall percentage" value={percent(result.percentage)} tone="primary" icon="trending-up-outline" />
                <Stat label="Overall grade" value={result.grade ?? '—'} tone="success" icon="ribbon-outline" />
              </StatGrid>
              {Object.entries(byExam).map(([examName, subjects]) => (
                <Card key={examName} title={examName}>
                  {subjects.map((s, index) => (
                    <View
                      key={`${s.examId}-${s.subject}`}
                      style={[styles.row, { alignItems: 'center' }, index === subjects.length - 1 && { borderBottomWidth: 0 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.body}>{s.subject}</Text>
                        <Text style={styles.muted}>
                          {s.absent ? 'Absent' : `${s.obtainedMarks} / ${s.maxMarks}`} · {formatDate(s.date)}
                        </Text>
                      </View>
                      <Badge label={s.grade} tone={s.absent || !s.passed ? 'danger' : 'success'} />
                    </View>
                  ))}
                </Card>
              ))}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

// ---------------------------------------------------------------- fees

const DEPOSIT_STATUS = {
  PENDING: { label: 'Verifying', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

/** `canDeposit` shows the "Deposit fee" buttons (Student and Parent apps). */
export function FeesScreen({ studentId, header, canDeposit = false }) {
  const summary = useApi(`/fees/students/${studentId}/summary`);
  const payments = useApi(`/fees/payments?studentId=${studentId}`);
  const deposits = useApi(`/fees/deposits?studentId=${studentId}`);
  const state = combine(summary, payments, deposits);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {([fees, paymentList, depositList]) => {
          const verifying = (dueId) =>
            depositList.filter((d) => d.feeDueId === dueId && d.status === 'PENDING').reduce((sum, d) => sum + d.amount, 0);
          return (
            <>
              <StatGrid>
                <Stat label="Total fees" value={rupees(fees.total)} icon="wallet-outline" />
                <Stat label="Paid" value={rupees(fees.paid)} tone="success" icon="checkmark-done-outline" />
                <Stat label="Pending" value={rupees(fees.pending)} tone={fees.pending > 0 ? 'warning' : 'success'} icon="hourglass-outline" />
                <Stat label="Overdue" value={rupees(fees.overdue)} tone={fees.overdue > 0 ? 'danger' : 'success'} icon="alert-circle-outline" />
              </StatGrid>

              <SectionTitle>Fee details</SectionTitle>
              {fees.dues.map((due) => {
                const waiting = verifying(due.id);
                const payable = due.pending - waiting;
                return (
                  <Card key={due.id} title={due.title} right={<Badge label={due.status} />}>
                    <Row label="Amount" value={rupees(due.amount)} />
                    {due.concession > 0 ? <Row label="Concession" value={`− ${rupees(due.concession)}`} /> : null}
                    <Row label="Paid" value={rupees(due.paid)} />
                    <Row label="Pending" value={rupees(due.pending)} />
                    {waiting > 0 ? <Row label="Awaiting verification" value={rupees(waiting)} /> : null}
                    <Row label="Due date" value={formatDate(due.dueDate)} last />
                    {canDeposit && payable > 0 ? (
                      <Button
                        title={`Deposit fee (${rupees(payable)})`}
                        icon="card-outline"
                        variant="secondary"
                        style={{ marginTop: 10 }}
                        onPress={() => router.push({ pathname: '/deposit', params: { dueId: due.id, studentId } })}
                      />
                    ) : null}
                  </Card>
                );
              })}

              <SectionTitle>Deposits</SectionTitle>
              {depositList.length === 0 ? (
                <Empty text={canDeposit ? 'Paid by UPI or bank? Tap “Deposit fee” on a fee above.' : 'No deposits submitted.'} icon="card-outline" />
              ) : (
                depositList.map((d) => (
                  <Card key={d.id} title={rupees(d.amount)} right={<Badge label={DEPOSIT_STATUS[d.status].label} tone={DEPOSIT_STATUS[d.status].tone} />}>
                    <Text style={styles.body}>{d.feeTitle}</Text>
                    <Text style={styles.muted}>
                      {d.paymentMode} · Ref {d.referenceNo} · Paid {formatDate(d.paidOn)}
                    </Text>
                    {d.reviewNote ? <Text style={[styles.muted, { marginTop: 4 }]}>Office note: {d.reviewNote}</Text> : null}
                  </Card>
                ))
              )}

              <SectionTitle>Payment history</SectionTitle>
              {paymentList.length === 0 ? (
                <Empty text="No payments yet." icon="receipt-outline" />
              ) : (
                paymentList.map((p) => (
                  <Card key={p.id} title={rupees(p.amount)} right={<Badge label={p.paymentMode} tone="neutral" />}>
                    <Text style={styles.body}>{p.feeTitle}</Text>
                    <Text style={styles.muted}>
                      Receipt {p.receiptNo} · {formatDateTime(p.paidAt)}
                    </Text>
                  </Card>
                ))
              )}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

// ---------------------------------------------------------------- homework

export function HomeworkScreen({ className, header }) {
  const state = useApi(className ? `/homework?className=${encodeURIComponent(className)}` : '/homework');
  const today = todayIso();

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(list) =>
          list.length === 0 ? (
            <Empty text="No homework assigned." icon="book-outline" />
          ) : (
            list.map((hw) => <HomeworkCard key={hw.id} homework={hw} today={today} />)
          )
        }
      </Loaded>
    </Screen>
  );
}

export function HomeworkCard({ homework, today = todayIso(), onPress }) {
  const due = homework.dueDate < today ? 'Past due' : homework.dueDate === today ? 'Due today' : `Due ${formatDate(homework.dueDate)}`;
  const tone = homework.dueDate < today ? 'neutral' : homework.dueDate === today ? 'danger' : 'info';
  return (
    <Card title={homework.title} right={<Badge label={due} tone={tone} />} onPress={onPress}>
      <Text style={[styles.muted, { marginBottom: 6 }]}>
        {homework.subject} · {homework.className} · {homework.teacherName}
      </Text>
      {homework.description ? <Text style={styles.body}>{homework.description}</Text> : null}
      {homework.instructions ? <Text style={[styles.muted, { marginTop: 6 }]}>{homework.instructions}</Text> : null}
      {homework.attachments?.length ? (
        <Text style={[styles.muted, { marginTop: 6, color: colors.info }]}>📎 {homework.attachments.join(', ')}</Text>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------- timetable

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/** A class's day-by-day schedule, or a teacher's week (pass teacherId instead of className). */
export function TimetableScreen({ className, teacherId, header }) {
  const todayName = weekdayOf(todayIso()).toUpperCase();
  const [day, setDay] = useState(DAYS.includes(todayName) ? todayName : 'MONDAY');
  const dayChips = <Chips options={DAYS.map((d) => ({ label: capitalize(d).slice(0, 3), value: d }))} value={day} onChange={setDay} />;

  if (className) {
    return <ClassDay className={className} day={day} header={<>{header}{dayChips}</>} isToday={day === todayName} />;
  }
  return <TeacherDay teacherId={teacherId} day={day} header={<>{header}{dayChips}</>} />;
}

function ClassDay({ className, day, header, isToday }) {
  const state = useApi(`/timetable/day?className=${encodeURIComponent(className)}&day=${day}`);
  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>{(slots) => <DaySchedule slots={slots} highlightNow={isToday} />}</Loaded>
    </Screen>
  );
}

function TeacherDay({ teacherId, day, header }) {
  const periods = useApi('/timetable/periods');
  const entries = useApi(`/timetable/teachers/${teacherId}`);
  const state = combine(periods, entries);
  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {([periodList, entryList]) => (
          <DaySchedule
            slots={periodList.map((p) => {
              const e = entryList.find((x) => x.day === day && x.periodId === p.id);
              return {
                periodId: p.id,
                label: p.label,
                startTime: p.startTime,
                endTime: p.endTime,
                type: p.type,
                subject: e?.subject ?? null,
                teacherName: e ? `Class ${e.className}` : null,
                room: e?.room ?? null,
              };
            })}
          />
        )}
      </Loaded>
    </Screen>
  );
}

/**
 * The school day period by period: time on the left, subject / teacher / room on the right. Breaks are
 * shaded; with `highlightNow` the period in progress is marked.
 */
export function DaySchedule({ slots, highlightNow = false }) {
  if (slots.length === 0) {
    return <Empty text="No school today." icon="sunny-outline" />;
  }
  const now = nowHHmm();
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {slots.map((slot, index) => {
        const isBreak = slot.type === 'break';
        const current = highlightNow && slot.startTime <= now && now < slot.endTime;
        return (
          <View
            key={slot.periodId}
            style={[
              local.slot,
              isBreak && { backgroundColor: '#F8FAFC' },
              current && { backgroundColor: colors.primarySoft },
              index === slots.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={local.slotTime}>
              <Text style={[styles.body, { fontWeight: '700', fontSize: 14 }]}>{slot.startTime}</Text>
              <Text style={styles.muted}>{slot.endTime}</Text>
            </View>
            <View style={[local.slotBar, { backgroundColor: current ? colors.primary : isBreak ? colors.border : colors.primarySoft }]} />
            <View style={{ flex: 1 }}>
              {isBreak ? (
                <Text style={[styles.muted, { fontWeight: '600' }]}>{slot.label}</Text>
              ) : slot.subject ? (
                <>
                  <Text style={[styles.body, { fontWeight: '700' }]} numberOfLines={1}>
                    {slot.subject}
                  </Text>
                  <Text style={styles.muted} numberOfLines={1}>
                    {slot.label} · {slot.teacherName}
                    {slot.room ? ` · ${slot.room}` : ''}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.muted}>Free period</Text>
                  <Text style={[styles.muted, styles.small]}>{slot.label}</Text>
                </>
              )}
            </View>
            {current ? <Badge label="Now" tone="primary" /> : null}
          </View>
        );
      })}
    </Card>
  );
}

// ---------------------------------------------------------------- study materials

export function MaterialsScreen({ className, header }) {
  const state = useApi(className ? `/study-materials?className=${encodeURIComponent(className)}` : '/study-materials');
  const [category, setCategory] = useState('All');
  const categories = useMemo(
    () => ['All', ...new Set((state.data ?? []).map((m) => m.category))],
    [state.data],
  );

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Chips options={categories.map((c) => ({ label: c, value: c }))} value={category} onChange={setCategory} />
      <Loaded state={state}>
        {(list) => {
          const shown = list.filter((m) => category === 'All' || m.category === category);
          return shown.length === 0 ? (
            <Empty text="No study materials yet." icon="folder-open-outline" />
          ) : (
            shown.map((m) => (
              <Card key={m.id} title={m.title} right={<Badge label={m.category} tone="info" />}>
                <Text style={styles.muted}>
                  {m.subject} · {m.teacherName} · {formatDate(m.uploadedDate)}
                </Text>
                <Text style={[styles.muted, { marginTop: 4 }]}>
                  {m.fileType} · {m.fileSize}
                </Text>
              </Card>
            ))
          );
        }}
      </Loaded>
    </Screen>
  );
}

// ---------------------------------------------------------------- upcoming exams

/** Exam papers with a date block on the left; text wraps instead of squeezing on narrow phones. */
export function UpcomingExamList({ papers }) {
  if (papers.length === 0) {
    return <Empty text="No exams scheduled." icon="document-text-outline" />;
  }
  return papers.map((paper) => {
    const { day, month, weekday } = dateParts(paper.date);
    return (
      <View key={paper.scheduleId} style={local.exam}>
        <View style={local.examDate}>
          <Text style={local.examDay}>{day}</Text>
          <Text style={local.examMonth}>{month}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.body, { fontWeight: '700' }]}>{paper.subject}</Text>
          <Text style={styles.muted}>{paper.examName}</Text>
          <Text style={[styles.muted, styles.small, { marginTop: 2 }]}>
            {weekday} · {paper.startTime}–{paper.endTime} · Max {paper.maxMarks} marks
          </Text>
        </View>
      </View>
    );
  });
}

// ---------------------------------------------------------------- home overview

/** Dashboard summary for one student: an entry of GET /dashboard (student) or its `children` (parent). */
export function StudentOverview({ overview }) {
  const { attendance, fees, upcomingExams, recentResults, homeworkDue, recentNotices, todaySchedule = [] } = overview;
  const feeTone = fees.overdue > 0 ? 'danger' : fees.pending > 0 ? 'warning' : 'success';
  return (
    <>
      <StatGrid>
        <Stat label="Attendance" value={percent(attendance.rate)} tone={rateTone(attendance.rate)} icon="calendar-outline" />
        <Stat label="Fees pending" value={rupees(fees.pending)} tone={feeTone} icon="wallet-outline" />
      </StatGrid>

      <SectionTitle>Today’s schedule</SectionTitle>
      <DaySchedule slots={todaySchedule} highlightNow />

      <SectionTitle>Homework due</SectionTitle>
      {homeworkDue.length === 0 ? (
        <Empty text="No homework due." icon="book-outline" />
      ) : (
        homeworkDue.slice(0, 3).map((hw) => <HomeworkCard key={hw.id} homework={hw} />)
      )}

      <SectionTitle>Upcoming exams</SectionTitle>
      <UpcomingExamList papers={upcomingExams} />

      <SectionTitle>Recent results</SectionTitle>
      {recentResults.length === 0 ? (
        <Empty text="No published results yet." icon="ribbon-outline" />
      ) : (
        <Card>
          {recentResults.map((r, index) => (
            <View
              key={`${r.examId}-${r.subject}`}
              style={[styles.row, { alignItems: 'center' }, index === recentResults.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.body}>{r.subject}</Text>
                <Text style={styles.muted}>{r.examName}</Text>
              </View>
              <Text style={[styles.body, { fontWeight: '700', marginRight: 8 }]}>
                {r.absent ? 'AB' : `${r.obtainedMarks}/${r.maxMarks}`}
              </Text>
              <Badge label={r.grade} tone={r.absent || !r.passed ? 'danger' : 'success'} />
            </View>
          ))}
        </Card>
      )}

      <SectionTitle>Latest notices</SectionTitle>
      {recentNotices.length === 0 ? (
        <Empty text="No notices." icon="megaphone-outline" />
      ) : (
        recentNotices.slice(0, 3).map((n) => (
          <Card key={n.id} title={n.title} right={<Badge label={n.priority} />}>
            <Text style={styles.muted} numberOfLines={2}>
              {n.description}
            </Text>
          </Card>
        ))
      )}
    </>
  );
}

function rateTone(rate) {
  if (rate == null) return 'neutral';
  if (rate >= 90) return 'success';
  return rate >= 75 ? 'warning' : 'danger';
}

function groupBy(items, keyOf) {
  return items.reduce((groups, item) => {
    const key = keyOf(item);
    (groups[key] ??= []).push(item);
    return groups;
  }, {});
}

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weekday: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  day: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 13, fontWeight: '700' },
  detail: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  slotTime: { width: 48 },
  slotBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  exam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  examDate: {
    width: 52,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examDay: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  examMonth: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, textTransform: 'uppercase' },
});
