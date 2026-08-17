import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CarrierLogo } from '../../src/components/CarrierLogo';
import { EventTimeline } from '../../src/components/EventTimeline';
import { GlassCard } from '../../src/components/GlassCard';
import { StatusBadge } from '../../src/components/StatusBadge';
import { getCarrierById } from '../../src/config/carriers';
import { deleteShipment, getShipmentById, setNotificationsEnabled } from '../../src/db/shipmentsRepository';
import { requestNotificationPermission } from '../../src/notifications/notificationService';
import { syncShipments } from '../../src/sync/syncEngine';
import { colors, radii, spacing, typography } from '../../src/theme/theme';
import type { Shipment } from '../../src/types/shipment';
import { formatRelativeTime } from '../../src/utils/format';

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const carrier = shipment ? getCarrierById(shipment.carrierId) : undefined;

  const load = useCallback(async () => {
    if (!id) return;
    const found = await getShipmentById(id);
    setShipment(found);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = async () => {
    if (!shipment) return;
    setRefreshing(true);
    try {
      await syncShipments([shipment], { notify: true });
    } catch (error) {
      console.warn('Aggiornamento spedizione fallito:', error);
    } finally {
      await load();
      setRefreshing(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!shipment) return;
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    await setNotificationsEnabled(shipment.id, value);
    setShipment({ ...shipment, notificationsEnabled: value });
  };

  const handleDelete = () => {
    if (!shipment) return;
    Alert.alert('Eliminare la spedizione?', `${carrier?.name ?? shipment.carrierId} · ${shipment.trackingNumber}`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await deleteShipment(shipment.id);
          router.back();
        },
      },
    ]);
  };

  if (!shipment) {
    return <View style={styles.flex} />;
  }

  return (
    <View style={styles.flex}>
      <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={StyleSheet.absoluteFill} />
      <Stack.Screen
        options={{
          title: shipment.label || shipment.trackingNumber,
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={12}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        <GlassCard contentStyle={styles.headerCard}>
          <CarrierLogo carrierId={shipment.carrierId} size={56} />
          <View style={styles.headerInfo}>
            <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
            <Text style={styles.carrierName}>{carrier?.name ?? shipment.carrierId}</Text>
            <StatusBadge status={shipment.status} />
          </View>
        </GlassCard>

        <GlassCard contentStyle={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Notifiche</Text>
            <Text style={styles.rowSubtitle}>Avvisami quando lo stato cambia</Text>
          </View>
          <Switch value={shipment.notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ true: colors.accent }} />
        </GlassCard>

        <Text style={styles.lastChecked}>Ultimo controllo: {formatRelativeTime(shipment.lastCheckedAt)}</Text>

        <GlassCard contentStyle={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Storico</Text>
          <EventTimeline events={shipment.events} />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  trackingNumber: {
    ...typography.title,
    color: colors.textPrimary,
  },
  carrierName: {
    ...typography.body,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  lastChecked: {
    ...typography.small,
    color: colors.textTertiary,
    alignSelf: 'center',
  },
  timelineCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});
