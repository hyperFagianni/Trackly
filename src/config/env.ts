/**
 * Tracking API configuration.
 *
 * Trackly talks to the 17TRACK aggregator (see README "Dati di tracciamento").
 * Two ways to configure it — pick one per environment:
 *
 * 1. RECOMMENDED — proxy (default): deploy the Cloudflare Worker in /server,
 *    which holds the real 17TRACK API key as a server-side secret, and point
 *    EXPO_PUBLIC_TRACKING_PROXY_URL at it. The app never sees the key.
 *
 * 2. SIMPLER, LESS SAFE — direct: set EXPO_PUBLIC_TRACKING_API_KEY and leave
 *    EXPO_PUBLIC_TRACKING_PROXY_URL unset. The app calls 17TRACK directly.
 *    Anything prefixed EXPO_PUBLIC_ is inlined into the JS bundle at build
 *    time and can be extracted from a compiled APK — acceptable for a small
 *    hobby project, not for a key you care about protecting.
 *
 * Both are read from env vars (via app.config / .env, see README) so no
 * secret ever needs to be hardcoded in source.
 */

const TRACKING_PROXY_URL = process.env.EXPO_PUBLIC_TRACKING_PROXY_URL?.trim() || null;
const TRACKING_DIRECT_API_KEY = process.env.EXPO_PUBLIC_TRACKING_API_KEY?.trim() || null;
const TRACKING_DIRECT_BASE_URL = 'https://api.17track.net/track/v2.4';

export const trackingApiConfig = {
  /** When set, all requests go through this proxy and no API key is needed client-side. */
  proxyUrl: TRACKING_PROXY_URL,
  /** Only used when proxyUrl is not set (direct-to-17TRACK fallback). */
  directApiKey: TRACKING_DIRECT_API_KEY,
  directBaseUrl: TRACKING_DIRECT_BASE_URL,
  get isConfigured(): boolean {
    return Boolean(TRACKING_PROXY_URL || TRACKING_DIRECT_API_KEY);
  },
};
