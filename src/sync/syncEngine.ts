import { fetchTrackingForShipment } from '../api/trackingClient';
import { getCarrierById, isApiCarrier } from '../config/carriers';
import { updateTrackingResult } from '../db/shipmentsRepository';
import { sendShipmentNotification } from '../notifications/notificationService';
import { buildStatusChangeNotification, hasStatusChanged, type StatusSnapshot } from '../notifications/statusDiff';
import type { Shipment } from '../types/shipment';

export interface SyncResult {
  updated: Shipment[];
  notifiedCount: number;
  failedCount: number;
}

/**
 * Fetches fresh tracking info for the given shipments (skipping any whose
 * carrier has no live API — see src/config/carriers.ts), persists it, and
 * fires a local notification for each one whose status meaningfully changed
 * (when `notify` is true and that shipment has notifications enabled).
 * Shared by both the background task and pull-to-refresh, so the "did this
 * actually change" decision is made in exactly one place.
 */
export async function syncShipments(shipments: Shipment[], options?: { notify?: boolean }): Promise<SyncResult> {
  const notify = options?.notify ?? true;

  const trackableItems = shipments
    .map((shipment) => {
      const carrier = getCarrierById(shipment.carrierId);
      return carrier && isApiCarrier(carrier) ? { shipment, carrier } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (trackableItems.length === 0) {
    return { updated: [], notifiedCount: 0, failedCount: 0 };
  }

  const results = await Promise.allSettled(
    trackableItems.map(({ shipment, carrier }) => fetchTrackingForShipment(carrier, shipment.trackingNumber)),
  );

  const updated: Shipment[] = [];
  let notifiedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < trackableItems.length; i++) {
    const { shipment } = trackableItems[i];
    const result = results[i];

    if (result.status === 'rejected') {
      console.warn(`Aggiornamento tracking fallito per ${shipment.trackingNumber}:`, result.reason);
      failedCount++;
      continue;
    }

    const parsed = result.value;
    const previousSnapshot: StatusSnapshot = {
      status: shipment.status,
      lastEventAt: shipment.lastEventAt,
      statusDescription: shipment.statusDescription,
    };
    const nextSnapshot: StatusSnapshot = {
      status: parsed.status,
      lastEventAt: parsed.lastEventAt,
      statusDescription: parsed.statusDescription,
    };

    await updateTrackingResult(shipment.id, {
      status: parsed.status,
      statusDescription: parsed.statusDescription,
      lastEventAt: parsed.lastEventAt,
      events: parsed.events,
    });

    if (notify && shipment.notificationsEnabled && hasStatusChanged(previousSnapshot, nextSnapshot)) {
      const carrier = getCarrierById(shipment.carrierId);
      const content = buildStatusChangeNotification({
        carrierName: carrier?.name ?? shipment.carrierId,
        trackingNumber: shipment.trackingNumber,
        label: shipment.label,
        next: nextSnapshot,
      });
      await sendShipmentNotification(content, { shipmentId: shipment.id });
      notifiedCount++;
    }

    updated.push({
      ...shipment,
      status: parsed.status,
      statusDescription: parsed.statusDescription,
      lastEventAt: parsed.lastEventAt,
      events: parsed.events,
      lastCheckedAt: Date.now(),
    });
  }

  return { updated, notifiedCount, failedCount };
}
