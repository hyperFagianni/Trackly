/**
 * Trackly tracking proxy — a thin Cloudflare Worker that sits between the app
 * and the 17TRACK API so the real API key never ships inside the app bundle.
 *
 * The app calls this worker's URL with the same paths 17TRACK exposes
 * (/register, /gettrackinfo); the worker attaches the `17token` header from a
 * server-side secret and forwards the request as-is.
 *
 * This endpoint is intentionally unauthenticated (no login system exists in
 * this hobby project) — it only forwards to a small allowlist of read/write
 * tracking endpoints, not an arbitrary proxy. If you're worried about someone
 * else finding the URL and burning through your 17TRACK quota, put a shared
 * secret header check here and set the matching value as another Worker
 * secret + an EXPO_PUBLIC_ env var in the app.
 */

export interface Env {
  TRACK17_API_KEY: string;
}

const UPSTREAM_BASE_URL = 'https://api.17track.net/track/v2.4';
const ALLOWED_PATHS = new Set(['/register', '/gettrackinfo']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== 'POST' || !ALLOWED_PATHS.has(url.pathname)) {
      return new Response('Not found', { status: 404 });
    }

    if (!env.TRACK17_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'TRACK17_API_KEY non configurata sul Worker.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body = await request.text();

    const upstreamResponse = await fetch(`${UPSTREAM_BASE_URL}${url.pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '17token': env.TRACK17_API_KEY,
      },
      body,
    });

    const responseBody = await upstreamResponse.text();
    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
