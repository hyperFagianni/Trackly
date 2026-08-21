import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { cardShadow, colors, glassHighlightColors, glassSheenColors, radii } from '../theme/theme';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
}

/**
 * Simulated "liquid glass" surface for Expo Go / Android compatibility: a
 * blurred, semi-transparent panel with a light border, a diagonal iridescent
 * sheen (as if sunlight were catching the glass edge) and a soft 3D shadow.
 * Real native glass (expo-glass-effect on iOS 26) is a dev-client-only
 * upgrade — see README section on aesthetics.
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
        <LinearGradient
          colors={glassSheenColors}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.15 }}
          style={styles.sheen}
        />
        <LinearGradient
          colors={glassHighlightColors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.4, y: 0.7 }}
          style={styles.topHighlight}
        />
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
  sheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  topHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
});
