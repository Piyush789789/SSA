import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { rupees } from '../format';
import { useT } from '../i18n';
import { colors } from '../theme';
import { useApi } from '../useApi';
import { Badge, Card, Empty, Loaded, Row, Screen, SectionTitle, styles } from '../ui';

/** Opens the phone dialer. */
export function callPhone(phone) {
  if (!phone) return;
  const url = `tel:${String(phone).replace(/[^\d+]/g, '')}`;
  Linking.openURL(url).catch(() => Alert.alert('Cannot call', `Dial ${phone} from your phone.`));
}

/** A name + phone line with a tap-to-call button. */
export function PhoneRow({ role, name, phone, last }) {
  const t = useT();
  return (
    <View style={[styles.row, { alignItems: 'center' }, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.muted}>{t(role)}</Text>
        <Text style={[styles.body, { fontWeight: '600' }]}>{name || '—'}</Text>
        {phone ? <Text style={styles.muted}>{phone}</Text> : null}
      </View>
      {phone ? (
        <Pressable
          onPress={() => callPhone(phone)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name ?? role}`}
          style={({ pressed }) => [local.call, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={local.callText}>{t('Call')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** "My bus": the student's route, stop, pickup/drop times, vehicle and the crew with tap-to-call. */
export function TransportScreen({ studentId, header }) {
  const state = useApi(studentId ? `/transport/students/${studentId}` : null);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      {header}
      <Loaded state={state}>
        {(data) =>
          data?.route ? (
            <BusDetails data={data} />
          ) : (
            <Empty text="Not using school transport. Contact the school office to join a bus route." icon="bus-outline" />
          )
        }
      </Loaded>
    </Screen>
  );
}

function BusDetails({ data }) {
  const { route, assignment } = data;
  const stop = data.stop ?? route.stops?.find((s) => s.name === assignment?.stopName) ?? null;
  return (
    <>
      <Card title={route.name} right={<Badge label={route.vehicleNumber || '—'} tone="primary" />}>
        <View style={local.times}>
          <View style={local.time}>
            <Ionicons name="sunny-outline" size={20} color={colors.warning} />
            <Text style={styles.muted}>Pickup</Text>
            <Text style={local.timeValue}>{stop?.pickupTime ?? '—'}</Text>
          </View>
          <View style={local.time}>
            <Ionicons name="moon-outline" size={20} color={colors.info} />
            <Text style={styles.muted}>Drop</Text>
            <Text style={local.timeValue}>{stop?.dropTime ?? '—'}</Text>
          </View>
        </View>
        <Row label="My stop" value={stop?.name ?? assignment?.stopName} />
        {route.monthlyFee != null ? <Row label="Monthly fee" value={rupees(route.monthlyFee)} /> : null}
        <Row label="Vehicle" value={route.vehicleNumber} last />
      </Card>

      <Card title="Bus crew">
        <PhoneRow role="Driver" name={route.driverName} phone={route.driverPhone} />
        <PhoneRow role="Attendant" name={route.attendantName} phone={route.attendantPhone} last />
      </Card>

      <SectionTitle>Stops</SectionTitle>
      <Card>
        {(route.stops ?? []).map((s, i, all) => {
          const mine = s.name === stop?.name;
          return (
            <View key={`${s.name}-${i}`} style={[styles.row, { alignItems: 'center' }, i === all.length - 1 && { borderBottomWidth: 0 }]}>
              <Ionicons name={mine ? 'location' : 'ellipse-outline'} size={16} color={mine ? colors.primary : colors.muted} />
              <Text style={[styles.body, { flex: 1 }, mine && { fontWeight: '700', color: colors.primaryDark }]}>{s.name}</Text>
              <Text style={styles.muted}>
                {s.pickupTime ?? '—'} / {s.dropTime ?? '—'}
              </Text>
            </View>
          );
        })}
      </Card>
    </>
  );
}

const local = StyleSheet.create({
  times: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  time: { flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingVertical: 10, gap: 2 },
  timeValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  callText: { color: '#fff', fontWeight: '700' },
});
