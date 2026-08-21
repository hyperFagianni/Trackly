import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '../src/components/AdSlot';
import { EmptyState } from '../src/components/EmptyState';
import { GlassButton } from '../src/components/GlassButton';
import { ShipmentCard } from '../src/components/ShipmentCard';
import { deleteShipment, getAllShipments, setNotificationsEnabled } from '../src/db/shipmentsRepository';
import { requestNotificationPermission } from '../src/notifications/notificationService';
import { syncShipments } from '../src/sync/syncEngine';
import { colors, spacing } from '../src/theme/theme';
import type { Shipment } from '../src/types/shipment';

export default function HomeScreen() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShipments = useCallback(async () => {
    const all = await getAllShipments();
    setShipments(all);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShipments();
    }, [loadShipments]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const current = await getAllShipments();
      await syncShipments(current, { notify: true });
    } catch (error) {
      console.warn('Aggiornamento spedizioni fallito:', error);
    } finally {
      await loadShipments();
      setRefreshing(false);
    }
  }, [loadShipments]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteShipment(id);
    setShipments((prev) => prev.filter((shipment) => shipment.id !== id));
  }, []);

  const handleToggleNotifications = useCallback(async (shipment: Shipment) => {
    const next = !shipment.notificationsEnabled;
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    await setNotificationsEnabled(shipment.id, next);
    setShipments((prev) =>
      prev.map((item) => (item.id === shipment.id ? { ...item, notificationsEnabled: next } : item)),
    );
  }, []);

  return (
    <View style={styles.flex}>
      <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={StyleSheet.absoluteFill} />
      <Stack.Screen
        options={{
          headerLeft: () => (
            <GlassButton onPress={() => router.push('/info')} shape="circle" size={34} tone="neutral" hitSlop={8}>
              <Ionicons name="information" size={16} color={colors.textSecondary} />
            </GlassButton>
          ),
          headerRight: () => (
            <GlassButton onPress={() => router.push('/add')} shape="circle" size={36} tone="accent" hitSlop={8}>
              <Ionicons name="add" size={20} color={colors.white} />
            </GlassButton>
          ),
        }}
      />
      <SafeAreaView style={styles.flex} edges={['left', 'right']}>
        <FlatList
          data={shipments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ShipmentCard
              shipment={item}
              onPress={() => router.push(`/shipment/${item.id}`)}
              onDelete={() => handleDelete(item.id)}
              onToggleNotifications={() => handleToggleNotifications(item)}
            />
          )}
          ListEmptyComponent={!loading ? <EmptyState /> : null}
          ListFooterComponent={<AdSlot />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
