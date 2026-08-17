import { StyleSheet, Text } from 'react-native';
import { AD_SLOT_CONFIG } from '../config/ads';
import { colors, radii, spacing, typography } from '../theme/theme';
import { GlassCard } from './GlassCard';

/**
 * Reserved ad space, controlled entirely by AD_SLOT_CONFIG.enabled
 * (see src/config/ads.ts). Renders nothing — no layout space, no view tree —
 * until that flag is flipped on and real ad content is wired in.
 */
export function AdSlot() {
  if (!AD_SLOT_CONFIG.enabled) return null;

  return (
    <GlassCard style={styles.card} contentStyle={styles.content} radius={radii.md}>
      <Text style={styles.text}>Spazio pubblicitario</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  content: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
