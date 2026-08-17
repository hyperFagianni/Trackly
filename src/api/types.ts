import type { ShipmentStatus, TrackingEvent } from '../types/shipment';

/** Normalized shape every provider (UPS/FedEx/DHL) parser produces, regardless of how different their raw API responses are. */
export interface ParsedTrackResult {
  trackingNumber: string;
  status: ShipmentStatus;
  statusDescription: string | null;
  lastEventAt: number | null;
  events: TrackingEvent[];
}
