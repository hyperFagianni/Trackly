import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CARRIERS, isApiCarrier } from '../config/carriers';
import { colors, glassSheenColors, radii, softShadow, spacing, typography } from '../theme/theme';

interface CarrierPickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CarrierPicker({ selectedId, onSelect }: CarrierPickerProps) {
  return (
    <View style={styles.grid}>
      {CARRIERS.map((carrier) => {
        const selected = carrier.id === selectedId;
        const live = isApiCarrier(carrier);
        return (
          <Pressable
            key={carrier.id}
            onPress={() => onSelect(carrier.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            {selected && (
              <LinearGradient
                colors={glassSheenColors}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Image source={carrier.logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {carrier.name}
            </Text>
            <View style={[styles.badge, live ? styles.badgeLive : styles.badgeExternal]}>
              <Text style={[styles.badgeText, live ? styles.badgeTextLive : styles.badgeTextExternal]}>
                {live ? 'Tracking live' : 'Link al sito'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    width: '31%',
    aspectRatio: 0.85,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.separator,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: '#EAF4FF',
    ...softShadow,
  },
  logo: {
    width: '70%',
    height: 28,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  badgeLive: {
    backgroundColor: '#E3F7EA',
  },
  badgeExternal: {
    backgroundColor: '#F0F0F2',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badgeTextLive: {
    color: colors.success,
  },
  badgeTextExternal: {
    color: colors.textTertiary,
  },
});
