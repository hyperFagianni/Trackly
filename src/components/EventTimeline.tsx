import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import type { TrackingEvent } from '../types/shipment';
import { formatDateTime } from '../utils/format';

export function EventTimeline({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return <Text style={styles.empty}>Nessun evento disponibile ancora.</Text>;
  }

  return (
    <View>
      {events.map((event, index) => (
        <View key={`${event.timestamp}-${index}`} style={styles.row}>
          <View style={styles.markerColumn}>
            <View style={[styles.dot, index === 0 && styles.dotActive]} />
            {index < events.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.content}>
            <Text style={styles.date}>{formatDateTime(event.timestamp)}</Text>
            <Text style={styles.description}>{event.description}</Text>
            {event.location ? <Text style={styles.location}>{event.location}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
  },
  markerColumn: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textTertiary,
    marginTop: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.separator,
    marginVertical: 2,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.sm,
  },
  date: {
    ...typography.small,
    color: colors.textTertiary,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 2,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
