export type ShipmentStatus =
  | 'unknown'
  | 'info_received'
  | 'in_transit'
  | 'pickup_available'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'expired';

export interface TrackingEvent {
  /** epoch milliseconds */
  timestamp: number;
  description: string;
  location?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrierId: string;
  label?: string;
  /** epoch milliseconds */
  createdAt: number;
  notificationsEnabled: boolean;
  status: ShipmentStatus;
  statusDescription: string | null;
  /** epoch milliseconds of the most recent tracking event, if any */
  lastEventAt: number | null;
  /** epoch milliseconds of the last time we successfully queried the tracking API */
  lastCheckedAt: number | null;
  events: TrackingEvent[];
}

export interface NewShipmentInput {
  trackingNumber: string;
  carrierId: string;
  label?: string;
}
