import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CARRIERS } from '../config/carriers';
import { colors, radii, spacing, typography } from '../theme/theme';

interface CarrierPickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CarrierPicker({ selectedId, onSelect }: CarrierPickerProps) {
  return (
    <View style={styles.grid}>
      {CARRIERS.map((carrier) => {
        const selected = carrier.id === selectedId;
        return (
          <Pressable
            key={carrier.id}
            onPress={() => onSelect(carrier.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Image source={carrier.logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {carrier.name}
            </Text>
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
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.separator,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: '#EAF4FF',
  },
  logo: {
    width: '70%',
    height: 32,
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
});
