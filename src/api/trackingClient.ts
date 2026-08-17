import { trackingApiConfig } from '../config/env';
import { parseGetTrackInfoResponse } from './parseTrackInfo';
import type { ParsedTrackResult, RawGetTrackInfoResponse } from './types';

export class TrackingApiNotConfiguredError extends Error {
  constructor() {
    super(
      'Nessuna configurazione per la tracking API: imposta EXPO_PUBLIC_TRACKING_PROXY_URL ' +
        'oppure EXPO_PUBLIC_TRACKING_API_KEY (vedi README).',
    );
    this.name = 'TrackingApiNotConfiguredError';
  }
}

interface TrackingItem {
  trackingNumber: string;
  carrierApiCode: number;
}

// 17TRACK accepts at most 40 tracking numbers per batch call.
const MAX_BATCH_SIZE = 40;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!trackingApiConfig.isConfigured) {
    throw new TrackingApiNotConfiguredError();
  }

  const usingProxy = Boolean(trackingApiConfig.proxyUrl);
  const url = usingProxy
    ? `${trackingApiConfig.proxyUrl!.replace(/\/$/, '')}${path}`
    : `${trackingApiConfig.directBaseUrl}${path}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!usingProxy) {
    headers['17token'] = trackingApiConfig.directApiKey!;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Richiesta tracking fallita (${response.status})`);
  }

  return (await response.json()) as T;
}

/** Registers tracking numbers with the aggregator so it starts polling the real carrier. Safe to call again for an already-registered number. */
export async function registerTrackingNumbers(items: TrackingItem[]): Promise<void> {
  if (items.length === 0) return;
  const batches = chunk(items, MAX_BATCH_SIZE);
  for (const batch of batches) {
    await post('/register', batch.map((item) => ({ number: item.trackingNumber, carrier: item.carrierApiCode })));
  }
}

/** Fetches current status + full event history for the given tracking numbers, already registered. */
export async function fetchTrackInfo(items: TrackingItem[]): Promise<Map<string, ParsedTrackResult>> {
  if (items.length === 0) return new Map();
  const merged = new Map<string, ParsedTrackResult>();
  const batches = chunk(items, MAX_BATCH_SIZE);
  for (const batch of batches) {
    const raw = await post<RawGetTrackInfoResponse>(
      '/gettrackinfo',
      batch.map((item) => ({ number: item.trackingNumber, carrier: item.carrierApiCode })),
    );
    const parsed = parseGetTrackInfoResponse(raw);
    for (const [trackingNumber, result] of parsed) {
      merged.set(trackingNumber, result);
    }
  }
  return merged;
}

/** Convenience: registers (idempotent) then immediately fetches current info for a single shipment. */
export async function trackSingleShipment(item: TrackingItem): Promise<ParsedTrackResult | null> {
  await registerTrackingNumbers([item]);
  const results = await fetchTrackInfo([item]);
  return results.get(item.trackingNumber) ?? null;
}
