import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDate } from '../format';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Chips, Empty, Loaded, Screen, styles } from '../ui';

/** Admit card for a student's upcoming (or ongoing) exams: exam, seat, papers and signature lines. */
export function AdmitCardScreen({ studentId, className, header }) {
  const exams = useApi('/exams');
  const [examId, setExamId] = useState(null);

  const upcoming = (exams.data ?? []).filter((e) => e.status !== 'Completed' && (!className || e.classes?.includes(className)));
  const selected = upcoming.find((e) => e.id === examId) ?? upcoming[0] ?? null;

  return (
    <Screen refreshing={exams.refreshing} onRefresh={exams.reload}>
      {header}
      <Loaded state={exams}>
        {() =>
          upcoming.length === 0 ? (
            <Empty text="No upcoming exams. Admit cards appear here before an exam." icon="id-card-outline" />
          ) : (
            <>
              {upcoming.length > 1 ? (
                <Chips options={upcoming.map((e) => ({ label: e.name, value: e.id }))} value={selected.id} onChange={setExamId} />
              ) : null}
              <AdmitCard key={selected.id} examId={selected.id} studentId={studentId} />
            </>
          )
        }
      </Loaded>
    </Screen>
  );
}

function AdmitCard({ examId, studentId }) {
  const state = useApi(`/exams/${examId}/admit-cards?studentId=${encodeURIComponent(studentId)}`);
  return (
    <Loaded state={state}>
      {(data) => {
        const card = data.cards?.[0];
        if (!card) return <Empty text="The admit card is not ready yet." icon="id-card-outline" />;
        const { school, exam } = data;
        const s = card.student;
        const papers = [...(card.papers ?? [])].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
        return (
          <View style={local.card}>
            <View style={local.letterhead}>
              <Text style={local.school}>{school?.schoolName}</Text>
              {school?.address ? <Text style={local.center}>{school.address}</Text> : null}
              <Text style={local.center}>
                {[school?.board, school?.affiliationNo && `Affiliation No. ${school.affiliationNo}`].filter(Boolean).join(' · ')}
              </Text>
              <Text style={local.title}>ADMIT CARD</Text>
              <Text style={[local.center, { fontWeight: '700', color: colors.text }]}>
                {exam?.name}
                {exam?.academicYear ? ` · ${exam.academicYear}` : ''}
              </Text>
            </View>

            <View style={local.details}>
              <View style={{ flex: 1 }}>
                <Detail label="Name" value={s?.name} />
                <Detail label="Class" value={s?.className} />
                <Detail label="Roll no." value={s?.rollNumber} />
                <Detail label="Student ID" value={s?.id} />
                <Detail label="Date of birth" value={s?.dateOfBirth ? formatDate(s.dateOfBirth) : null} />
              </View>
              <View style={local.photo}>
                <Text style={[styles.muted, styles.small, { textAlign: 'center' }]}>Photo</Text>
              </View>
            </View>

            <View style={local.seat}>
              <View style={{ flex: 1 }}>
                <Text style={styles.muted}>Room</Text>
                <Text style={local.seatValue}>{card.room ?? 'To be announced'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.muted}>Seat no.</Text>
                <Text style={local.seatValue}>{card.seatNumber ?? '—'}</Text>
              </View>
            </View>

            <View style={local.table}>
              <View style={[local.tr, local.th]}>
                <Text style={[local.cell, local.headCell, { flex: 1.2 }]}>Date</Text>
                <Text style={[local.cell, local.headCell, { flex: 1.2 }]}>Time</Text>
                <Text style={[local.cell, local.headCell, { flex: 1.4 }]}>Subject</Text>
              </View>
              {papers.length === 0 ? (
                <Text style={[styles.muted, { padding: 10 }]}>No papers scheduled yet.</Text>
              ) : (
                papers.map((p, i) => (
                  <View key={`${p.subject}-${p.date}`} style={[local.tr, i === papers.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[local.cell, { flex: 1.2 }]}>{formatDate(p.date)}</Text>
                    <Text style={[local.cell, { flex: 1.2 }]}>
                      {p.startTime}–{p.endTime}
                    </Text>
                    <Text style={[local.cell, { flex: 1.4, fontWeight: '600' }]}>{p.subject}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={local.signatures}>
              <View style={local.signature}>
                <View style={local.signLine} />
                <Text style={styles.muted}>Student</Text>
              </View>
              <View style={local.signature}>
                <View style={local.signLine} />
                <Text style={styles.muted}>Principal{school?.principalName ? ` (${school.principalName})` : ''}</Text>
              </View>
            </View>
          </View>
        );
      }}
    </Loaded>
  );
}

function Detail({ label, value }) {
  return (
    <View style={local.detail}>
      <Text style={[styles.muted, { width: 92 }]}>{label}</Text>
      <Text style={[styles.body, { flex: 1, fontWeight: '600' }]}>{value ?? '—'}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  letterhead: { alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.text },
  school: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  center: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: 2, color: colors.primaryDark, marginTop: 8 },
  details: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  detail: { flexDirection: 'row', paddingVertical: 3 },
  photo: {
    width: 78,
    height: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seat: { flexDirection: 'row', backgroundColor: colors.primarySoft, borderRadius: 8, padding: 10, marginBottom: 10 },
  seatValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 6 },
  tr: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  th: { backgroundColor: colors.background },
  cell: { padding: 8, fontSize: 13, color: colors.text },
  headCell: { fontWeight: '700', color: colors.muted },
  signatures: { flexDirection: 'row', gap: 24, marginTop: 36 },
  signature: { flex: 1, alignItems: 'center' },
  signLine: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: colors.text, marginBottom: 4 },
});
