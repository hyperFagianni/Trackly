import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CarrierLogo } from '../../src/components/CarrierLogo';
import { EventTimeline } from '../../src/components/EventTimeline';
import { GlassButton } from '../../src/components/GlassButton';
import { GlassCard } from '../../src/components/GlassCard';
import { StatusBadge } from '../../src/components/StatusBadge';
import { getCarrierById, isApiCarrier } from '../../src/config/carriers';
import { deleteShipment, getShipmentById, setNotificationsEnabled } from '../../src/db/shipmentsRepository';
import { requestNotificationPermission } from '../../src/notifications/notificationService';
import { syncShipments } from '../../src/sync/syncEngine';
import { colors, spacing, typography } from '../../src/theme/theme';
import type { Shipment } from '../../src/types/shipment';
import { formatRelativeTime } from '../../src/utils/format';

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const carrier = shipment ? getCarrierById(shipment.carrierId) : undefined;
  const live = carrier ? isApiCarrier(carrier) : false;

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

  const handleOpenExternalTracking = async () => {
    if (!shipment || !carrier || isApiCarrier(carrier)) return;
    await Linking.openURL(carrier.buildTrackingUrl(shipment.trackingNumber));
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
            <GlassButton onPress={handleDelete} shape="circle" size={34} tone="danger" hitSlop={8}>
              <Ionicons name="trash-outline" size={17} color={colors.white} />
            </GlassButton>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          live ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} /> : undefined
        }
      >
        <GlassCard contentStyle={styles.headerCard}>
          <CarrierLogo carrierId={shipment.carrierId} size={56} />
          <View style={styles.headerInfo}>
            <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
            <Text style={styles.carrierName}>{carrier?.name ?? shipment.carrierId}</Text>
            {live && <StatusBadge status={shipment.status} />}
          </View>
        </GlassCard>

        {live ? (
          <>
            <GlassCard contentStyle={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Notifiche</Text>
                <Text style={styles.rowSubtitle}>Avvisami quando lo stato cambia</Text>
              </View>
              <Switch
                value={shipment.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ true: colors.accent }}
              />
            </GlassCard>

            <Text style={styles.lastChecked}>Ultimo controllo: {formatRelativeTime(shipment.lastCheckedAt)}</Text>

            <GlassCard contentStyle={styles.timelineCard}>
              <Text style={styles.sectionTitle}>Storico</Text>
              <EventTimeline events={shipment.events} />
            </GlassCard>
          </>
        ) : (
          <GlassCard contentStyle={styles.externalCard}>
            <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.externalTitle}>Tracking live non disponibile</Text>
            <Text style={styles.externalBody}>
              {carrier && 'note' in carrier && carrier.note
                ? carrier.note
                : `${carrier?.name ?? shipment.carrierId} non offre un'API di tracciamento gratuita senza un contratto business, quindi Trackly non può mostrare qui lo stato in tempo reale.`}
            </Text>
            <GlassButton onPress={handleOpenExternalTracking} style={styles.externalButtonWrap}>
              <Ionicons name="open-outline" size={18} color={colors.white} />
              <Text style={styles.externalButtonText}>Apri il sito di {carrier?.name ?? 'il corriere'}</Text>
            </GlassButton>
            <Text style={styles.externalHint}>
              {carrier && !isApiCarrier(carrier) && carrier.deepLinkSupported
                ? 'Si aprirà direttamente la pagina della tua spedizione.'
                : 'Il sito di questo corriere non permette di aprire direttamente una spedizione: incolla il numero di tracking nella pagina di ricerca.'}
            </Text>
          </GlassCard>
        )}
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
  externalCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  externalTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  externalBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  externalButtonWrap: {
    marginTop: spacing.xs,
  },
  externalButtonText: {
    ...typography.headline,
    color: colors.white,
  },
  externalHint: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
