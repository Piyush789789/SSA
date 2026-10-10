import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatDateTime, percent } from '../format';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Badge, Card, Empty, Loaded, Row, Screen, SectionTitle, Stat, StatGrid, styles } from '../ui';

const SUBJECT_W = 120;
const EXAM_W = 84;
const TOTAL_W = 84;
const PCT_W = 64;
const GRADE_W = 56;

function marksText(result) {
  if (!result) return '—';
  if (result.absent) return 'AB';
  if (result.obtainedMarks == null) return '—';
  return `${result.obtainedMarks}/${result.maxMarks}`;
}

/**
 * CBSE-style report card for one academic year: marks per subject and exam, totals, attendance and the
 * class teacher's co-scholastic grades and remark for each term. Students and parents only see exams
 * whose results are published. Printing is done on the website.
 */
export function ReportCardScreen({ studentId, header }) {
  const state = useApi(`/report-cards/${studentId}`);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(card) => {
          const { student, overall, attendance } = card;
          const exams = card.exams ?? [];
          const subjects = card.subjects ?? [];
          const notes = card.notes ?? [];
          const coScholasticAreas = card.coScholasticAreas ?? [];
          return (
            <>
              <Card title={student?.name} right={<Badge label={card.academicYear} tone="primary" />}>
                <Row label="Class" value={student?.className} />
                <Row label="Roll no." value={student?.rollNumber} />
                <Row label="Admission no." value={student?.id} />
                {student?.dateOfBirth ? <Row label="Date of birth" value={formatDate(student.dateOfBirth)} /> : null}
                <Row label="Class teacher" value={card.classTeacher} last />
              </Card>

              <SectionTitle>Scholastic areas</SectionTitle>
              {subjects.length === 0 ? (
                <Empty text="No published results for this year yet." icon="ribbon-outline" />
              ) : (
                <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                      <View style={[table.row, table.headRow]}>
                        <Text style={[table.cell, table.head, { width: SUBJECT_W, textAlign: 'left' }]}>Subject</Text>
                        {exams.map((exam) => (
                          <Text key={exam.id} style={[table.cell, table.head, { width: EXAM_W }]} numberOfLines={2}>
                            {exam.name}
                          </Text>
                        ))}
                        <Text style={[table.cell, table.head, { width: TOTAL_W }]}>Total</Text>
                        <Text style={[table.cell, table.head, { width: PCT_W }]}>%</Text>
                        <Text style={[table.cell, table.head, { width: GRADE_W }]}>Grade</Text>
                      </View>
                      {subjects.map((s, index) => (
                        <View key={s.subject} style={[table.row, index % 2 === 1 && table.stripe]}>
                          <Text style={[table.cell, { width: SUBJECT_W, textAlign: 'left', fontWeight: '600' }]}>{s.subject}</Text>
                          {exams.map((exam) => {
                            const result = s.marks?.[exam.id];
                            return (
                              <Text
                                key={exam.id}
                                style={[table.cell, { width: EXAM_W }, result && result.passed === false && { color: colors.danger }]}
                              >
                                {marksText(result)}
                              </Text>
                            );
                          })}
                          <Text style={[table.cell, { width: TOTAL_W }]}>
                            {s.totalObtained}/{s.totalMax}
                          </Text>
                          <Text style={[table.cell, { width: PCT_W }]}>{s.percentage ?? '—'}</Text>
                          <Text style={[table.cell, { width: GRADE_W, fontWeight: '700' }]}>{s.grade ?? '—'}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <Card title="Overall" right={overall.result ? <Badge label={overall.result} tone={overall.result === 'Pass' ? 'success' : 'warning'} /> : null}>
                <Row label="Total marks" value={overall.totalMax ? `${overall.totalObtained} / ${overall.totalMax}` : '—'} />
                <Row label="Percentage" value={percent(overall.percentage)} />
                <Row label="Grade" value={overall.grade} last={!overall.failedSubjects?.length} />
                {overall.failedSubjects?.length ? <Row label="Needs improvement in" value={overall.failedSubjects.join(', ')} last /> : null}
              </Card>

              <SectionTitle>Attendance</SectionTitle>
              <StatGrid>
                <Stat label="Attendance rate" value={percent(attendance?.rate)} tone="success" icon="pie-chart-outline" />
                <Stat label="Working days" value={attendance?.workingDays ?? '—'} icon="calendar-outline" />
                <Stat label="Present" value={attendance?.present ?? '—'} tone="success" icon="checkmark-circle-outline" />
                <Stat label="Absent" value={attendance?.absent ?? '—'} tone="danger" icon="close-circle-outline" />
              </StatGrid>

              <SectionTitle>Co-scholastic areas & remarks</SectionTitle>
              {notes.length === 0 ? (
                <Empty text="The class teacher has not added term notes yet." icon="color-palette-outline" />
              ) : (
                [...notes]
                  .sort((a, b) => String(a.term).localeCompare(String(b.term)))
                  .map((note) => (
                    <Card key={note.term} title={note.term}>
                      {coScholasticAreas.map((area) => (
                        <Row key={area} label={area} value={note.coScholastic?.[area] ?? '—'} />
                      ))}
                      <Text style={[styles.label, { marginTop: 10, marginBottom: 2 }]}>Class teacher’s remark</Text>
                      <Text style={styles.body}>{note.remark || '—'}</Text>
                      {note.updatedBy ? (
                        <Text style={[styles.muted, styles.small, { marginTop: 6 }]}>
                          {note.updatedBy} · {formatDateTime(note.updatedAt)}
                        </Text>
                      ) : null}
                    </Card>
                  ))
              )}
              <Text style={[styles.muted, { textAlign: 'center', marginTop: 4 }]}>
                Co-scholastic grades are A, B or C. Ask the school office for a printed report card.
              </Text>
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

const table = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headRow: { backgroundColor: colors.primarySoft },
  stripe: { backgroundColor: colors.background },
  cell: { paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, color: colors.text, textAlign: 'center' },
  head: { fontWeight: '700', fontSize: 12, color: colors.primaryDark },
});
