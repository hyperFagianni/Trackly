import type { ShipmentStatus, TrackingEvent } from '../../types/shipment';
import type { ParsedTrackResult } from '../types';

/**
 * FedEx Track API v1 (developer.fedex.com). Modeled from FedEx's public
 * docs — not tested against a live account. Defensive parsing throughout;
 * verify against a real response once you have credentials.
 */

export interface FedexCredentials {
  clientId: string;
  clientSecret: string;
}

const TOKEN_URL = 'https://apis.fedex.com/oauth/token';
const TRACK_URL = 'https://apis.fedex.com/track/v1/trackingnumbers';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(credentials: FedexCredentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(credentials.clientId)}&client_secret=${encodeURIComponent(credentials.clientSecret)}`,
  });
  if (!response.ok) {
    throw new Error(`Autenticazione FedEx fallita (${response.status})`);
  }
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export interface RawFedexTrackResponse {
  output?: {
    completeTrackResults?: Array<{
      trackingNumber?: string;
      trackResults?: Array<{
        latestStatusDetail?: { derivedCode?: string; description?: string };
        scanEvents?: Array<{
          date?: string; // ISO 8601
          derivedStatusCode?: string;
          eventDescription?: string;
          scanLocation?: { city?: string; countryCode?: string };
        }>;
      }>;
    }>;
  };
}

export async function fetchFedexTrackingRaw(
  trackingNumber: string,
  credentials: FedexCredentials,
): Promise<RawFedexTrackResponse> {
  const token = await getAccessToken(credentials);
  const response = await fetch(TRACK_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-locale': 'it_IT',
    },
    body: JSON.stringify({
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Richiesta tracking FedEx fallita (${response.status})`);
  }
  return (await response.json()) as RawFedexTrackResponse;
}

function mapFedexStatus(code: string | undefined): ShipmentStatus {
  switch ((code ?? '').toUpperCase()) {
    case 'DL':
      return 'delivered';
    case 'OD':
      return 'out_for_delivery';
    case 'PU':
    case 'IT':
    case 'AR':
    case 'DP':
      return 'in_transit';
    case 'OC':
      return 'info_received';
    case 'DE':
    case 'CA':
      return 'exception';
    default:
      return 'unknown';
  }
}

export function parseFedexResponse(raw: RawFedexTrackResponse, trackingNumber: string): ParsedTrackResult {
  const trackResult = raw?.output?.completeTrackResults?.[0]?.trackResults?.[0];
  const events: TrackingEvent[] = [];

  for (const scan of trackResult?.scanEvents ?? []) {
    if (!scan.date || !scan.eventDescription) continue;
    const timestamp = Date.parse(scan.date);
    if (Number.isNaN(timestamp)) continue;
    const location = scan.scanLocation
      ? [scan.scanLocation.city, scan.scanLocation.countryCode].filter(Boolean).join(', ')
      : undefined;
    events.push({ timestamp, description: scan.eventDescription, location: location || undefined });
  }
  events.sort((a, b) => b.timestamp - a.timestamp);

  const status = mapFedexStatus(trackResult?.latestStatusDetail?.derivedCode);
  const statusDescription = trackResult?.latestStatusDetail?.description ?? events[0]?.description ?? null;
  const lastEventAt = events[0]?.timestamp ?? null;

  return { trackingNumber, status, statusDescription, lastEventAt, events };
}

export async function fetchFedexTracking(
  trackingNumber: string,
  credentials: FedexCredentials,
): Promise<ParsedTrackResult> {
  const raw = await fetchFedexTrackingRaw(trackingNumber, credentials);
  return parseFedexResponse(raw, trackingNumber);
}
