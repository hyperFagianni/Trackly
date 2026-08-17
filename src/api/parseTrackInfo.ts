import type { ShipmentStatus, TrackingEvent } from '../types/shipment';
import type {
  ParsedTrackResult,
  RawAcceptedItem,
  RawGetTrackInfoResponse,
  RawTrackEvent,
  RawTrackInfo,
} from './types';

const STATUS_MAP: Record<string, ShipmentStatus> = {
  notfound: 'unknown',
  inforeceived: 'info_received',
  intransit: 'in_transit',
  expired: 'expired',
  availableforpickup: 'pickup_available',
  outfordelivery: 'out_for_delivery',
  deliveryfailure: 'exception',
  delivered: 'delivered',
  exception: 'exception',
};

export function mapApiStatus(status: string | undefined | null): ShipmentStatus {
  if (!status) return 'unknown';
  const normalized = status.toLowerCase().replace(/[^a-z]/g, '');
  return STATUS_MAP[normalized] ?? 'unknown';
}

function parseEventTimestamp(event: RawTrackEvent | undefined): number | null {
  const raw = event?.time_iso ?? event?.time_utc;
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseEvents(trackInfo: RawTrackInfo | undefined): TrackingEvent[] {
  const rawEvents = trackInfo?.tracking?.providers?.flatMap((provider) => provider.events ?? []) ?? [];
  const events: TrackingEvent[] = [];
  for (const raw of rawEvents) {
    const timestamp = parseEventTimestamp(raw);
    if (timestamp === null || !raw.description) continue;
    events.push({
      timestamp,
      description: raw.description,
      location: raw.location || undefined,
    });
  }
  events.sort((a, b) => b.timestamp - a.timestamp);
  return events;
}

export function parseAcceptedItem(item: RawAcceptedItem): ParsedTrackResult {
  const trackInfo = item.track_info;
  const events = parseEvents(trackInfo);
  const status = mapApiStatus(trackInfo?.latest_status?.status);
  const latestEventDescription = trackInfo?.latest_event?.description ?? events[0]?.description ?? null;
  const latestEventTimestamp = parseEventTimestamp(trackInfo?.latest_event) ?? events[0]?.timestamp ?? null;

  return {
    trackingNumber: item.number,
    status,
    statusDescription: latestEventDescription,
    lastEventAt: latestEventTimestamp,
    events,
  };
}

/** Parses a full gettrackinfo response into a map keyed by tracking number. Rejected numbers are simply absent from the result. */
export function parseGetTrackInfoResponse(
  raw: RawGetTrackInfoResponse | null | undefined,
): Map<string, ParsedTrackResult> {
  const results = new Map<string, ParsedTrackResult>();
  const accepted = raw?.data?.accepted ?? [];
  for (const item of accepted) {
    if (!item?.number) continue;
    results.set(item.number, parseAcceptedItem(item));
  }
  return results;
}
