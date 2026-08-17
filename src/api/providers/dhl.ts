import type { ShipmentStatus, TrackingEvent } from '../../types/shipment';
import type { ParsedTrackResult } from '../types';

/**
 * DHL Shipment Tracking - Unified Tracking API (developer.dhl.com). Modeled
 * from DHL's public docs — not tested against a live account. Free tier is
 * capped at 250 calls/day, max 1 call/5 sec (see README) — kept in mind by
 * only calling this on demand (pull-to-refresh) or from the background task,
 * never in a tight loop.
 */

export interface DhlCredentials {
  apiKey: string;
}

const TRACK_URL = 'https://api-eu.dhl.com/track/shipments';

export interface RawDhlTrackResponse {
  shipments?: Array<{
    status?: {
      timestamp?: string;
      statusCode?: string;
      description?: string;
    };
    events?: Array<{
      timestamp?: string;
      statusCode?: string;
      description?: string;
      location?: { address?: { addressLocality?: string } };
    }>;
  }>;
}

export async function fetchDhlTrackingRaw(
  trackingNumber: string,
  credentials: DhlCredentials,
): Promise<RawDhlTrackResponse> {
  const response = await fetch(`${TRACK_URL}?trackingNumber=${encodeURIComponent(trackingNumber)}`, {
    headers: { 'DHL-API-Key': credentials.apiKey },
  });
  if (!response.ok) {
    throw new Error(`Richiesta tracking DHL fallita (${response.status})`);
  }
  return (await response.json()) as RawDhlTrackResponse;
}

/** DHL's top-level statusCode enum doesn't distinguish "out for delivery" from generic transit — inferred from the event description text as a fallback. */
function mapDhlStatus(statusCode: string | undefined, latestDescription: string | undefined): ShipmentStatus {
  const code = (statusCode ?? '').toLowerCase();
  const text = (latestDescription ?? '').toLowerCase();

  if (code === 'delivered') return 'delivered';
  if (code === 'failure') return 'exception';
  if (text.includes('out for delivery') || text.includes('with delivery courier')) return 'out_for_delivery';
  if (text.includes('ready for pickup') || text.includes('available for collection')) return 'pickup_available';
  if (code === 'pre-transit') return 'info_received';
  if (code === 'transit') return 'in_transit';
  return 'unknown';
}

export function parseDhlResponse(raw: RawDhlTrackResponse, trackingNumber: string): ParsedTrackResult {
  const shipment = raw?.shipments?.[0];
  const events: TrackingEvent[] = [];

  for (const event of shipment?.events ?? []) {
    if (!event.timestamp || !event.description) continue;
    const timestamp = Date.parse(event.timestamp);
    if (Number.isNaN(timestamp)) continue;
    events.push({
      timestamp,
      description: event.description,
      location: event.location?.address?.addressLocality || undefined,
    });
  }
  events.sort((a, b) => b.timestamp - a.timestamp);

  const status = mapDhlStatus(shipment?.status?.statusCode, shipment?.status?.description ?? events[0]?.description);
  const statusDescription = shipment?.status?.description ?? events[0]?.description ?? null;
  const parsedStatusTimestamp = shipment?.status?.timestamp ? Date.parse(shipment.status.timestamp) : NaN;
  const lastEventAt = Number.isNaN(parsedStatusTimestamp) ? (events[0]?.timestamp ?? null) : parsedStatusTimestamp;

  return { trackingNumber, status, statusDescription, lastEventAt, events };
}

export async function fetchDhlTracking(trackingNumber: string, credentials: DhlCredentials): Promise<ParsedTrackResult> {
  const raw = await fetchDhlTrackingRaw(trackingNumber, credentials);
  return parseDhlResponse(raw, trackingNumber);
}
