import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationContent } from './statusDiff';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelConfigured = false;

/** Sets up the Android notification channel. Safe/cheap to call multiple times. */
export async function ensureNotificationChannel(): Promise<void> {
  if (channelConfigured || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('shipment-updates', {
    name: 'Aggiornamenti spedizioni',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0A84FF',
  });
  channelConfigured = true;
}

/** Requests OS notification permission if not already granted. Returns whether we're allowed to notify. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    // Most emulators still deliver local notifications fine; this is informational only.
    console.warn('Le notifiche locali sono più affidabili su un dispositivo fisico.');
  }
  await ensureNotificationChannel();
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Fires a local notification immediately. */
export async function sendShipmentNotification(
  content: NotificationContent,
  data?: Record<string, unknown>,
): Promise<void> {
  await ensureNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data,
    },
    trigger: null,
  });
}
