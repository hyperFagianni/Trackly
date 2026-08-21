import type { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { buttonShadow, glassHighlightColors, glassSheenColors, radii } from '../theme/theme';

type GlassButtonTone = 'accent' | 'danger' | 'neutral';
type GlassButtonShape = 'pill' | 'circle';

interface GlassButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  tone?: GlassButtonTone;
  shape?: GlassButtonShape;
  size?: number;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
}

const TONE_GRADIENTS: Record<GlassButtonTone, readonly [string, string]> = {
  accent: ['#5CB4FF', '#0A6FE0'],
  danger: ['#FF7A6E', '#DE2A1B'],
  neutral: ['#FBFBFD', '#DDE2EA'],
};

const DISABLED_GRADIENT: readonly [string, string] = ['#B7BBC2', '#9A9EA6'];

const PRESS_SPRING = { damping: 16, stiffness: 260 };

/**
 * "Liquid glass" button: a glossy gradient fill topped with an iridescent
 * sheen and a specular highlight, a 3D drop shadow, and a spring press-down
 * for tactile feedback — see the reference aesthetic in GlassCard.
 */
export function GlassButton({
  onPress,
  disabled,
  tone = 'accent',
  shape = 'pill',
  size = 40,
  style,
  hitSlop,
  children,
}: PropsWithChildren<GlassButtonProps>) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.035 }, { translateY: pressed.value * 2 }],
    shadowOpacity: buttonShadow.shadowOpacity * (1 - pressed.value * 0.55),
    shadowRadius: buttonShadow.shadowRadius * (1 - pressed.value * 0.4),
  }));

  const shapeStyle: ViewStyle =
    shape === 'circle' ? { width: size, height: size, borderRadius: size / 2 } : { borderRadius: radii.md };

  return (
    <Animated.View style={[shapeStyle, disabled ? undefined : buttonShadow, animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={() => {
          pressed.value = withSpring(1, PRESS_SPRING);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, PRESS_SPRING);
        }}
        style={[styles.clip, shapeStyle]}
      >
        <LinearGradient
          colors={disabled ? DISABLED_GRADIENT : TONE_GRADIENTS[tone]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {!disabled && (
          <>
            <LinearGradient
              colors={glassSheenColors}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0.1 }}
              style={styles.sheen}
            />
            <LinearGradient
              colors={glassHighlightColors}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.5, y: 0.8 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        <View style={shape === 'circle' ? styles.circleContent : styles.pillContent}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  circleContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
