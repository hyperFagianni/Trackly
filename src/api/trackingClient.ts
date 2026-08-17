import type { ApiCarrier, ApiProvider } from '../config/carriers';
import { isProviderConfigured, trackingApiConfig } from '../config/env';
import { fetchDhlTrackingRaw, parseDhlResponse } from './providers/dhl';
import { fetchFedexTrackingRaw, parseFedexResponse } from './providers/fedex';
import { fetchUpsTrackingRaw, parseUpsResponse } from './providers/ups';
import type { ParsedTrackResult } from './types';

export class TrackingApiNotConfiguredError extends Error {
  constructor(provider: ApiProvider) {
    super(
      `Nessuna configurazione per l'API ${provider.toUpperCase()}: imposta EXPO_PUBLIC_TRACKING_PROXY_URL ` +
        `oppure le credenziali dirette del corriere (vedi README).`,
    );
    this.name = 'TrackingApiNotConfiguredError';
  }
}

/** Fetches the raw upstream JSON via the proxy Worker — same shape as calling the carrier directly, so parsing is identical either way. */
async function fetchViaProxy(provider: ApiProvider, trackingNumber: string): Promise<unknown> {
  const response = await fetch(`${trackingApiConfig.proxyUrl!.replace(/\/$/, '')}/${provider}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingNumber }),
  });
  if (!response.ok) {
    throw new Error(`Richiesta tracking fallita (${response.status})`);
  }
  return response.json();
}

/** Fetches and normalizes current tracking info for a single API-mode shipment (UPS/FedEx/DHL). Throws TrackingApiNotConfiguredError if neither the proxy nor that carrier's direct credentials are set. */
export async function fetchTrackingForShipment(
  carrier: ApiCarrier,
  trackingNumber: string,
): Promise<ParsedTrackResult> {
  if (!isProviderConfigured(carrier.apiProvider)) {
    throw new TrackingApiNotConfiguredError(carrier.apiProvider);
  }
  const useProxy = Boolean(trackingApiConfig.proxyUrl);

  switch (carrier.apiProvider) {
    case 'ups': {
      const raw = useProxy
        ? await fetchViaProxy('ups', trackingNumber)
        : await fetchUpsTrackingRaw(trackingNumber, {
            clientId: trackingApiConfig.direct.ups.clientId!,
            clientSecret: trackingApiConfig.direct.ups.clientSecret!,
          });
      return parseUpsResponse(raw as Parameters<typeof parseUpsResponse>[0], trackingNumber);
    }
    case 'fedex': {
      const raw = useProxy
        ? await fetchViaProxy('fedex', trackingNumber)
        : await fetchFedexTrackingRaw(trackingNumber, {
            clientId: trackingApiConfig.direct.fedex.clientId!,
            clientSecret: trackingApiConfig.direct.fedex.clientSecret!,
          });
      return parseFedexResponse(raw as Parameters<typeof parseFedexResponse>[0], trackingNumber);
    }
    case 'dhl': {
      const raw = useProxy
        ? await fetchViaProxy('dhl', trackingNumber)
        : await fetchDhlTrackingRaw(trackingNumber, { apiKey: trackingApiConfig.direct.dhl.apiKey! });
      return parseDhlResponse(raw as Parameters<typeof parseDhlResponse>[0], trackingNumber);
    }
  }
}
