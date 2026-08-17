import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { cardShadow, colors, radii } from '../theme/theme';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
}

/**
 * Simulated "liquid glass" surface for Expo Go / Android compatibility: a
 * blurred, semi-transparent panel with a light border and soft shadow. Real
 * native glass (expo-glass-effect on iOS 26) is a dev-client-only upgrade —
 * see README section on aesthetics.
 *
 * Split into an outer shadow-only view and an inner overflow:hidden view
 * because iOS drops the shadow entirely on a view that also clips its content.
 */
export function GlassCard({ children, style, contentStyle, radius = radii.lg, intensity = 40 }: PropsWithChildren<GlassCardProps>) {
  return (
    <View style={[{ borderRadius: radius }, cardShadow, style]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tintOverlay} />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
