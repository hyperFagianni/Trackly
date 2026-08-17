import { base64Encode } from '../../utils/base64';
import { generateId } from '../../utils/id';
import type { ShipmentStatus, TrackingEvent } from '../../types/shipment';
import type { ParsedTrackResult } from '../types';

/**
 * UPS Track API v1 (developer.ups.com). Modeled from UPS's public docs —
 * not tested against a live account (none was available while building this).
 * Written defensively (safe optional chaining, text-hint fallbacks for the
 * fuzzier states) so a schema surprise degrades to "unknown" instead of
 * crashing. Verify against a real response once you have credentials.
 */

export interface UpsCredentials {
  clientId: string;
  clientSecret: string;
}

const TOKEN_URL = 'https://onlinetools.ups.com/security/v1/oauth/token';
const TRACK_URL = 'https://onlinetools.ups.com/api/track/v1/details';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(credentials: UpsCredentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }
  const basicAuth = base64Encode(`${credentials.clientId}:${credentials.clientSecret}`);
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    throw new Error(`Autenticazione UPS fallita (${response.status})`);
  }
  const json = (await response.json()) as { access_token: string; expires_in: string | number };
  const expiresInMs = Number(json.expires_in) * 1000;
  cachedToken = { accessToken: json.access_token, expiresAt: Date.now() + expiresInMs };
  return json.access_token;
}

export interface RawUpsTrackResponse {
  trackResponse?: {
    shipment?: Array<{
      package?: Array<{
        trackingNumber?: string;
        currentStatus?: { code?: string; description?: string; type?: string };
        activity?: Array<{
          date?: string; // YYYYMMDD
          time?: string; // HHMMSS
          status?: { code?: string; description?: string; type?: string };
          location?: { address?: { city?: string; stateProvince?: string; countryCode?: string } };
        }>;
      }>;
    }>;
  };
}

export async function fetchUpsTrackingRaw(
  trackingNumber: string,
  credentials: UpsCredentials,
): Promise<RawUpsTrackResponse> {
  const token = await getAccessToken(credentials);
  const response = await fetch(`${TRACK_URL}/${encodeURIComponent(trackingNumber)}?locale=it_IT&returnSignature=false`, {
    headers: {
      Authorization: `Bearer ${token}`,
      transId: generateId(),
      transactionSrc: 'trackly',
    },
  });
  if (!response.ok) {
    throw new Error(`Richiesta tracking UPS fallita (${response.status})`);
  }
  return (await response.json()) as RawUpsTrackResponse;
}

function mapUpsStatus(type: string | undefined, description: string | undefined): ShipmentStatus {
  const text = (description ?? '').toLowerCase();
  const code = (type ?? '').toUpperCase();

  if (code === 'D' || text.includes('delivered')) return 'delivered';
  if (text.includes('out for delivery')) return 'out_for_delivery';
  if (text.includes('access point') || text.includes('ready for pickup') || text.includes('available for pickup')) {
    return 'pickup_available';
  }
  if (code === 'X' || text.includes('exception') || text.includes('delay')) return 'exception';
  if (code === 'M' || text.includes('order processed') || text.includes('label')) return 'info_received';
  if (code === 'I' || code === 'P' || text.includes('transit') || text.includes('departed') || text.includes('arrived')) {
    return 'in_transit';
  }
  return 'unknown';
}

/** UPS activity timestamps are two separate fields (YYYYMMDD + HHMMSS) in the local time of the scan location, not UTC — parsed as-is without timezone conversion. */
function parseUpsTimestamp(date: string | undefined, time: string | undefined): number | null {
  if (!date || date.length !== 8) return null;
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  const hh = time && time.length === 6 ? time.slice(0, 2) : '00';
  const mm = time && time.length === 6 ? time.slice(2, 4) : '00';
  const ss = time && time.length === 6 ? time.slice(4, 6) : '00';
  const parsed = Date.parse(`${year}-${month}-${day}T${hh}:${mm}:${ss}`);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseUpsResponse(raw: RawUpsTrackResponse, trackingNumber: string): ParsedTrackResult {
  const pkg = raw?.trackResponse?.shipment?.[0]?.package?.[0];
  const events: TrackingEvent[] = [];

  for (const activity of pkg?.activity ?? []) {
    const timestamp = parseUpsTimestamp(activity.date, activity.time);
    const description = activity.status?.description;
    if (timestamp === null || !description) continue;
    const address = activity.location?.address;
    const location = address ? [address.city, address.countryCode].filter(Boolean).join(', ') : undefined;
    events.push({ timestamp, description, location: location || undefined });
  }
  events.sort((a, b) => b.timestamp - a.timestamp);

  const status = mapUpsStatus(pkg?.currentStatus?.type, pkg?.currentStatus?.description);
  const statusDescription = pkg?.currentStatus?.description ?? events[0]?.description ?? null;
  const lastEventAt = events[0]?.timestamp ?? null;

  return { trackingNumber, status, statusDescription, lastEventAt, events };
}

export async function fetchUpsTracking(trackingNumber: string, credentials: UpsCredentials): Promise<ParsedTrackResult> {
  const raw = await fetchUpsTrackingRaw(trackingNumber, credentials);
  return parseUpsResponse(raw, trackingNumber);
}
