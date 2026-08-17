import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getCarrierById } from '../config/carriers';
import { colors, radii, spacing, typography } from '../theme/theme';
import type { Shipment } from '../types/shipment';
import { formatRelativeTime } from '../utils/format';
import { CarrierLogo } from './CarrierLogo';
import { GlassCard } from './GlassCard';
import { StatusBadge } from './StatusBadge';

const ACTION_WIDTH = 84;
const OPEN_THRESHOLD = ACTION_WIDTH * 0.5;
const MAX_TRANSLATE = ACTION_WIDTH * 1.15;
const SPRING_CONFIG = { damping: 22, stiffness: 220 };

interface ShipmentCardProps {
  shipment: Shipment;
  onPress: () => void;
  onDelete: () => void;
  onToggleNotifications: () => void;
}

export function ShipmentCard({ shipment, onPress, onDelete, onToggleNotifications }: ShipmentCardProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const carrier = getCarrierById(shipment.carrierId);
  const carrierName = carrier?.name ?? shipment.carrierId;

  const close = () => {
    'worklet';
    translateX.value = withSpring(0, SPRING_CONFIG);
  };

  const confirmDelete = () => {
    Alert.alert('Eliminare la spedizione?', `${carrierName} · ${shipment.trackingNumber}`, [
      { text: 'Annulla', style: 'cancel', onPress: () => close() },
      { text: 'Elimina', style: 'destructive', onPress: onDelete },
    ]);
  };

  const handleToggleNotifications = () => {
    onToggleNotifications();
    close();
  };

  const handlePress = () => {
    if (translateX.value !== 0) {
      close();
      return;
    }
    onPress();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      translateX.value = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, next));
    })
    .onEnd(() => {
      if (translateX.value > OPEN_THRESHOLD) {
        translateX.value = withSpring(ACTION_WIDTH, SPRING_CONFIG);
      } else if (translateX.value < -OPEN_THRESHOLD) {
        translateX.value = withSpring(-ACTION_WIDTH, SPRING_CONFIG);
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, translateX.value / ACTION_WIDTH)),
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, -translateX.value / ACTION_WIDTH)),
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.actionLeft, leftActionStyle]} pointerEvents="box-none">
        <Pressable onPress={confirmDelete} style={styles.actionButton} hitSlop={8}>
          <Ionicons name="trash" size={22} color={colors.white} />
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.actionRight, rightActionStyle]} pointerEvents="box-none">
        <Pressable onPress={handleToggleNotifications} style={styles.actionButton} hitSlop={8}>
          <Ionicons
            name={shipment.notificationsEnabled ? 'notifications-off' : 'notifications'}
            size={22}
            color={colors.white}
          />
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <Pressable onPress={handlePress}>
            <GlassCard contentStyle={styles.content}>
              <CarrierLogo carrierId={shipment.carrierId} />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {shipment.label || shipment.trackingNumber}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {carrierName} · {shipment.trackingNumber}
                </Text>
                <StatusBadge status={shipment.status} />
              </View>
              <View style={styles.meta}>
                {!shipment.notificationsEnabled && (
                  <Ionicons name="notifications-off-outline" size={15} color={colors.textTertiary} />
                )}
                <Text style={styles.time}>{formatRelativeTime(shipment.lastCheckedAt)}</Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    backgroundColor: colors.danger,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    backgroundColor: colors.accent,
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    ...typography.small,
    color: colors.textTertiary,
  },
});
