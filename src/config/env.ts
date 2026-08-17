import type { ApiProvider } from './carriers';

/**
 * Tracking API configuration for UPS, FedEx and DHL — the only carriers with
 * a genuinely free, self-serve direct API (see README "Dati di tracciamento").
 *
 * Two ways to configure it, per environment:
 *
 * 1. RECOMMENDED — proxy (default): deploy the Cloudflare Worker in /server,
 *    which holds all three carriers' credentials as server-side secrets, and
 *    point EXPO_PUBLIC_TRACKING_PROXY_URL at it. The app never sees them.
 *
 * 2. SIMPLER, LESS SAFE — direct: set the EXPO_PUBLIC_*_CLIENT_ID/SECRET (or
 *    _API_KEY) vars below per carrier and leave EXPO_PUBLIC_TRACKING_PROXY_URL
 *    unset. Anything prefixed EXPO_PUBLIC_ is inlined into the JS bundle at
 *    build time and can be extracted from a compiled APK — acceptable for a
 *    small hobby project, not for credentials you care about protecting.
 *
 * You can configure any subset of the three carriers — a shipment for an
 * unconfigured one just shows "API non configurata" instead of breaking the
 * rest of the app.
 */

const proxyUrl = process.env.EXPO_PUBLIC_TRACKING_PROXY_URL?.trim() || null;

export const trackingApiConfig = {
  proxyUrl,
  direct: {
    ups: {
      clientId: process.env.EXPO_PUBLIC_UPS_CLIENT_ID?.trim() || null,
      clientSecret: process.env.EXPO_PUBLIC_UPS_CLIENT_SECRET?.trim() || null,
    },
    fedex: {
      clientId: process.env.EXPO_PUBLIC_FEDEX_CLIENT_ID?.trim() || null,
      clientSecret: process.env.EXPO_PUBLIC_FEDEX_CLIENT_SECRET?.trim() || null,
    },
    dhl: {
      apiKey: process.env.EXPO_PUBLIC_DHL_API_KEY?.trim() || null,
    },
  },
};

export function isProviderConfigured(provider: ApiProvider): boolean {
  if (trackingApiConfig.proxyUrl) return true;
  if (provider === 'ups') {
    return Boolean(trackingApiConfig.direct.ups.clientId && trackingApiConfig.direct.ups.clientSecret);
  }
  if (provider === 'fedex') {
    return Boolean(trackingApiConfig.direct.fedex.clientId && trackingApiConfig.direct.fedex.clientSecret);
  }
  if (provider === 'dhl') {
    return Boolean(trackingApiConfig.direct.dhl.apiKey);
  }
  return false;
}
