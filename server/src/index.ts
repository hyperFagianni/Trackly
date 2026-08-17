/**
 * Trackly tracking proxy — a thin Cloudflare Worker between the app and
 * UPS/FedEx/DHL so their real API credentials never ship inside the app
 * bundle.
 *
 * Routes mirror the app's providers (src/api/providers/*.ts): the app POSTs
 * `{ trackingNumber }` to /ups/track, /fedex/track or /dhl/track, and this
 * worker attaches the right auth (OAuth2 for UPS/FedEx, an API key header
 * for DHL) and returns the carrier's raw JSON unchanged — parsing happens
 * app-side, in one place, so it's identical whether you're using this proxy
 * or calling a carrier directly.
 *
 * This endpoint is intentionally unauthenticated (no login system exists in
 * this hobby project) — it only forwards to three fixed tracking endpoints,
 * not an arbitrary proxy. If you're worried about someone else finding the
 * URL and burning through your free-tier quota (DHL: 250 calls/day), add a
 * shared-secret header check here and the matching EXPO_PUBLIC_ value in the
 * app.
 */

export interface Env {
  UPS_CLIENT_ID: string;
  UPS_CLIENT_SECRET: string;
  FEDEX_CLIENT_ID: string;
  FEDEX_CLIENT_SECRET: string;
  DHL_API_KEY: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Module-scope: persists across requests handled by the same isolate, reset
// on cold start. Not persistent storage, just avoids re-authenticating on
// every single request within a warm isolate.
let cachedUpsToken: CachedToken | null = null;
let cachedFedexToken: CachedToken | null = null;

async function getUpsToken(env: Env): Promise<string> {
  if (cachedUpsToken && cachedUpsToken.expiresAt > Date.now() + 30_000) {
    return cachedUpsToken.accessToken;
  }
  const basicAuth = btoa(`${env.UPS_CLIENT_ID}:${env.UPS_CLIENT_SECRET}`);
  const response = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error(`UPS auth failed (${response.status})`);
  const json = (await response.json()) as { access_token: string; expires_in: string | number };
  const expiresInMs = Number(json.expires_in) * 1000;
  cachedUpsToken = { accessToken: json.access_token, expiresAt: Date.now() + expiresInMs };
  return json.access_token;
}

async function getFedexToken(env: Env): Promise<string> {
  if (cachedFedexToken && cachedFedexToken.expiresAt > Date.now() + 30_000) {
    return cachedFedexToken.accessToken;
  }
  const response = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(env.FEDEX_CLIENT_ID)}&client_secret=${encodeURIComponent(env.FEDEX_CLIENT_SECRET)}`,
  });
  if (!response.ok) throw new Error(`FedEx auth failed (${response.status})`);
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedFedexToken = { accessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function handleUps(request: Request, env: Env): Promise<Response> {
  const { trackingNumber } = (await request.json()) as { trackingNumber: string };
  const token = await getUpsToken(env);
  const upstream = await fetch(
    `https://onlinetools.ups.com/api/track/v1/details/${encodeURIComponent(trackingNumber)}?locale=it_IT&returnSignature=false`,
    { headers: { Authorization: `Bearer ${token}`, transId: crypto.randomUUID(), transactionSrc: 'trackly' } },
  );
  return relay(upstream);
}

async function handleFedex(request: Request, env: Env): Promise<Response> {
  const { trackingNumber } = (await request.json()) as { trackingNumber: string };
  const token = await getFedexToken(env);
  const upstream = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
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
  return relay(upstream);
}

async function handleDhl(request: Request, env: Env): Promise<Response> {
  const { trackingNumber } = (await request.json()) as { trackingNumber: string };
  const upstream = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    { headers: { 'DHL-API-Key': env.DHL_API_KEY } },
  );
  return relay(upstream);
}

async function relay(upstream: Response): Promise<Response> {
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }
    const { pathname } = new URL(request.url);

    try {
      if (pathname === '/ups/track') return await handleUps(request, env);
      if (pathname === '/fedex/track') return await handleFedex(request, env);
      if (pathname === '/dhl/track') return await handleDhl(request, env);
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
