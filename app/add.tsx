import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchTrackingForShipment } from '../src/api/trackingClient';
import { CarrierPicker } from '../src/components/CarrierPicker';
import { GlassButton } from '../src/components/GlassButton';
import { GlassCard } from '../src/components/GlassCard';
import { getCarrierById, isApiCarrier } from '../src/config/carriers';
import { insertShipment, updateTrackingResult } from '../src/db/shipmentsRepository';
import { requestNotificationPermission } from '../src/notifications/notificationService';
import { colors, spacing, typography } from '../src/theme/theme';

export default function AddShipmentScreen() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [label, setLabel] = useState('');
  const [carrierId, setCarrierId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = trackingNumber.trim().length > 0 && carrierId !== null && !saving;

  const handleSave = async () => {
    if (!canSave || !carrierId) return;
    setSaving(true);
    try {
      const shipment = await insertShipment({
        trackingNumber,
        carrierId,
        label: label.trim() || undefined,
      });
      requestNotificationPermission().catch(() => {});
      router.back();

      // Best-effort first fetch: the shipment is already saved either way, and
      // will pick up data on the next pull-to-refresh or background sync.
      // Carriers without a live API (see src/config/carriers.ts) simply skip this.
      const carrier = getCarrierById(carrierId);
      if (carrier && isApiCarrier(carrier)) {
        fetchTrackingForShipment(carrier, shipment.trackingNumber)
          .then((result) =>
            updateTrackingResult(shipment.id, {
              status: result.status,
              statusDescription: result.statusDescription,
              lastEventAt: result.lastEventAt,
              events: result.events,
            }),
          )
          .catch((error) => console.warn('Primo recupero tracking fallito:', error));
      }
    } catch (error) {
      console.warn('Salvataggio spedizione fallito:', error);
      Alert.alert('Errore', 'Non è stato possibile salvare la spedizione. Riprova.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassCard contentStyle={styles.card}>
            <Text style={styles.sectionLabel}>Numero di tracking</Text>
            <TextInput
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Es. 1Z999AA10123456784"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={[styles.sectionLabel, styles.spaced]}>Nome (opzionale)</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Es. Scarpe nuove"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
          </GlassCard>

          <Text style={styles.sectionTitle}>Corriere</Text>
          <CarrierPicker selectedId={carrierId} onSelect={setCarrierId} />
        </ScrollView>

        <View style={styles.footer}>
          <GlassButton onPress={handleSave} disabled={!canSave}>
            <Text style={styles.saveButtonText}>{saving ? 'Salvataggio…' : 'Aggiungi spedizione'}</Text>
          </GlassButton>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  spaced: {
    marginTop: spacing.md,
  },
  input: {
    ...typography.headline,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
  },
  saveButtonText: {
    ...typography.headline,
    color: colors.white,
  },
});
