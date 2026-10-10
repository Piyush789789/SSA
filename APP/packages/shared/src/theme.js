/** Same orange brand as the website. */
export const colors = {
  primary: '#FF6B2C',
  primaryDark: '#E04E15',
  primarySoft: '#FFF5F0',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  background: '#F8FAFC',
  card: '#FFFFFF',
  success: '#047857',
  successSoft: '#ECFDF5',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  info: '#1D4ED8',
  infoSoft: '#EFF6FF',
};

export const tones = {
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  neutral: { fg: colors.muted, bg: '#F1F5F9' },
  primary: { fg: colors.primaryDark, bg: colors.primarySoft },
};

/** Badge colour for the status words the backend uses. */
export function toneFor(status) {
  switch (String(status ?? '').toLowerCase()) {
    case 'present':
    case 'paid':
    case 'submitted':
    case 'published':
    case 'completed':
    case 'pass':
      return 'success';
    case 'late':
    case 'partial':
    case 'draft':
    case 'ongoing':
    case 'medium':
      return 'warning';
    case 'absent':
    case 'overdue':
    case 'fail':
    case 'high':
      return 'danger';
    case 'leave':
    case 'pending':
    case 'upcoming':
      return 'info';
    default:
      return 'neutral';
  }
}

export const tabScreenOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  headerShadowVisible: false,
};

export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};
