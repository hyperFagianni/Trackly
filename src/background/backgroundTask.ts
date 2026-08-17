import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getAllShipments } from '../db/shipmentsRepository';
import { syncShipments } from '../sync/syncEngine';

/**
 * The OS decides exactly when this runs (WorkManager on Android, BGTaskScheduler
 * on iOS) — `minimumInterval` below is a floor, not a guarantee. In practice
 * expect anywhere from a few minutes to a few hours between runs, and note
 * that on iOS this only actually executes from Expo Go if... it mostly
 * doesn't: Expo Go's fixed binary can't declare the BGTaskScheduler
 * entitlements this needs, so real background execution there is
 * Android-only until the app is built with a dev client / prebuild. See
 * README "Limitazioni note".
 */
export const BACKGROUND_SYNC_TASK = 'trackly-background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const shipments = await getAllShipments();
    const trackedShipments = shipments.filter((shipment) => shipment.notificationsEnabled);
    if (trackedShipments.length === 0) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    await syncShipments(trackedShipments, { notify: true });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn('Task in background fallito:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSyncAsync(): Promise<void> {
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (alreadyRegistered) return;
  await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15,
  });
}

export async function unregisterBackgroundSyncAsync(): Promise<void> {
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (alreadyRegistered) {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}
