import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Ionicons name="cube-outline" size={56} color={colors.textTertiary} />
      <Text style={styles.title}>Nessuna spedizione</Text>
      <Text style={styles.subtitle}>Tocca “+” per aggiungere il tuo primo numero di tracking.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
