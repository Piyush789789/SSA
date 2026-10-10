import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { SCHOOL_NAME } from '../config';
import { fileSource } from '../files';
import { formatDate } from '../format';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Empty, Loaded, Screen, SectionTitle, styles } from '../ui';

/** Digital ID card (front and back) of one student: GET /id-cards?studentId=. */
export function IdCardScreen({ studentId, header }) {
  const state = useApi(studentId ? `/id-cards?studentId=${encodeURIComponent(studentId)}` : null);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(data) => {
          const card = data?.cards?.[0];
          if (!card) return <Empty text="No ID card is available yet." icon="id-card-outline" />;
          const school = data.school ?? {};
          return (
            <>
              <SectionTitle>Front side</SectionTitle>
              <View style={local.card}>
                <View style={local.band}>
                  <Text style={local.school} numberOfLines={2}>
                    {school.schoolName ?? SCHOOL_NAME}
                  </Text>
                  {school.address ? (
                    <Text style={local.bandSmall} numberOfLines={1}>
                      {school.address}
                    </Text>
                  ) : null}
                </View>
                <View style={local.body}>
                  {card.photoFileId ? (
                    <Image source={fileSource(card.photoFileId)} style={local.photo} resizeMode="cover" />
                  ) : (
                    <View style={[local.photo, local.noPhoto]}>
                      <Ionicons name="person" size={44} color={colors.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={local.name}>{card.name}</Text>
                    <Text style={local.role}>{card.role ?? 'Student'}</Text>
                    <Line label="Class" value={card.className ? `${card.className}${card.rollNumber != null ? ` · Roll ${card.rollNumber}` : ''}` : null} />
                    <Line label="ID" value={card.id} />
                    <Line label="DOB" value={card.dateOfBirth ? formatDate(card.dateOfBirth) : null} />
                    <Line label="Blood" value={card.bloodGroup} />
                  </View>
                </View>
                <View style={local.footer}>
                  <Text style={styles.muted}>
                    {data.academicYear ? `Session ${data.academicYear} · ` : ''}Valid till {formatDate(data.validTill)}
                  </Text>
                  <Text style={[styles.muted, { fontStyle: 'italic' }]}>Principal</Text>
                </View>
              </View>

              <SectionTitle>Back side</SectionTitle>
              <View style={[local.card, { padding: 14 }]}>
                <Line label="Guardian" value={card.guardianName} />
                <Line label="Phone" value={card.phone} />
                <Line label="Address" value={card.address} />
                <Line label="Bus route" value={card.transportRoute ? `${card.transportRoute}${card.transportStop ? ` · ${card.transportStop}` : ''}` : 'Not using school transport'} />
                {school.phone ? (
                  <Text style={[styles.muted, { marginTop: 10 }]}>
                    If found, please return to {school.schoolName ?? SCHOOL_NAME} · {school.phone}
                  </Text>
                ) : null}
              </View>
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

function Line({ label, value }) {
  return (
    <View style={local.line}>
      <Text style={local.lineLabel}>{label}</Text>
      <Text style={local.lineValue}>{value || '—'}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  band: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 14 },
  school: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bandSmall: { color: '#FFE7DB', fontSize: 11, marginTop: 2 },
  body: { flexDirection: 'row', gap: 14, padding: 14 },
  photo: { width: 92, height: 112, borderRadius: 10, backgroundColor: colors.border },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  role: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, textTransform: 'uppercase', marginBottom: 6 },
  line: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  lineLabel: { width: 70, fontSize: 12, color: colors.muted },
  lineValue: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
});
