import { STATUS_META } from '../config/statusMeta';
import type { ShipmentStatus } from '../types/shipment';

export interface StatusSnapshot {
  status: ShipmentStatus;
  lastEventAt: number | null;
  statusDescription: string | null;
}

/**
 * Decides whether a freshly-fetched status should trigger a notification,
 * compared to the last snapshot we persisted for that shipment.
 *
 * - An "unknown" result (API returned nothing usable, or the number isn't
 *   found yet) never triggers a notification — it usually just means the
 *   carrier hasn't picked up the parcel yet, not a real change.
 * - A change in the normalized status (e.g. in_transit -> delivered) always
 *   notifies.
 * - A same-status but newer event timestamp still notifies (e.g. multiple
 *   "in_transit" scan events at different depots are each worth surfacing).
 */
export function hasStatusChanged(previous: StatusSnapshot, next: StatusSnapshot): boolean {
  if (next.status === 'unknown') return false;
  if (previous.status !== next.status) return true;
  if (next.lastEventAt !== null && next.lastEventAt !== previous.lastEventAt) return true;
  return false;
}

export interface NotificationContent {
  title: string;
  body: string;
}

export function buildStatusChangeNotification(params: {
  carrierName: string;
  trackingNumber: string;
  label?: string;
  next: StatusSnapshot;
}): NotificationContent {
  const { carrierName, trackingNumber, label, next } = params;
  const statusLabel = STATUS_META[next.status].label;
  return {
    title: label && label.trim().length > 0 ? label : `${carrierName} · ${trackingNumber}`,
    body: next.statusDescription ? `${statusLabel}: ${next.statusDescription}` : statusLabel,
  };
}
