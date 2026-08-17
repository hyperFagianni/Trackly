import { fetchTrackInfo } from '../api/trackingClient';
import type { ParsedTrackResult } from '../api/types';
import { getCarrierById } from '../config/carriers';
import { updateTrackingResult } from '../db/shipmentsRepository';
import { buildStatusChangeNotification, hasStatusChanged, type StatusSnapshot } from '../notifications/statusDiff';
import { sendShipmentNotification } from '../notifications/notificationService';
import type { Shipment } from '../types/shipment';

export interface SyncResult {
  updated: Shipment[];
  notifiedCount: number;
  failedCount: number;
}

/**
 * Fetches fresh tracking info for the given shipments, persists it, and fires
 * a local notification for each one whose status meaningfully changed (when
 * `notify` is true and that shipment has notifications enabled). Shared by
 * both the background task and the home screen's pull-to-refresh, so the
 * "did this actually change" decision is made in exactly one place.
 */
export async function syncShipments(shipments: Shipment[], options?: { notify?: boolean }): Promise<SyncResult> {
  const notify = options?.notify ?? true;
  if (shipments.length === 0) {
    return { updated: [], notifiedCount: 0, failedCount: 0 };
  }

  const trackableItems = shipments
    .map((shipment) => {
      const carrier = getCarrierById(shipment.carrierId);
      return carrier ? { shipment, trackingNumber: shipment.trackingNumber, carrierApiCode: carrier.trackingApiCarrierCode } : null;
    })
    .filter((item): item is { shipment: Shipment; trackingNumber: string; carrierApiCode: number } => item !== null);

  let resultsMap: Map<string, ParsedTrackResult>;
  try {
    resultsMap = await fetchTrackInfo(
      trackableItems.map(({ trackingNumber, carrierApiCode }) => ({ trackingNumber, carrierApiCode })),
    );
  } catch (error) {
    console.warn('Sincronizzazione spedizioni fallita:', error);
    return { updated: [], notifiedCount: 0, failedCount: trackableItems.length };
  }

  const updated: Shipment[] = [];
  let notifiedCount = 0;
  let failedCount = 0;

  for (const { shipment, trackingNumber } of trackableItems) {
    const parsed = resultsMap.get(trackingNumber);
    if (!parsed) {
      failedCount++;
      continue;
    }

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
