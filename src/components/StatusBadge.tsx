import { StyleSheet, Text, View } from 'react-native';
import { STATUS_META } from '../config/statusMeta';
import { radii, spacing, typography } from '../theme/theme';
import type { ShipmentStatus } from '../types/shipment';

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const meta = STATUS_META[status];
  return (
    <View style={[styles.badge, { backgroundColor: `${meta.color}1F`, borderColor: `${meta.color}55` }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
