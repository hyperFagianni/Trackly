/**
 * Shapes for the 17TRACK "gettrackinfo" v2.4 response.
 *
 * These are modeled from 17TRACK's public API documentation
 * (https://api.17track.net/en/doc) rather than a live call — this project was
 * built without a provisioned API key. Field presence/casing should be
 * re-verified against a real response after you obtain a key (see README);
 * parseTrackInfo.ts is written defensively (optional chaining, safe
 * fallbacks) specifically so small shape mismatches degrade to an "unknown"
 * status instead of crashing.
 */
export interface RawTrackEvent {
  time_iso?: string;
  time_utc?: string;
  description?: string;
  location?: string;
  stage?: string;
}

export interface RawTrackInfo {
  latest_status?: {
    status?: string;
    sub_status?: string;
  };
  latest_event?: RawTrackEvent;
  tracking?: {
    providers?: Array<{
      events?: RawTrackEvent[];
    }>;
  };
}

export interface RawAcceptedItem {
  number: string;
  carrier: number;
  track_info?: RawTrackInfo;
}

export interface RawRejectedItem {
  number: string;
  carrier?: number;
  error?: { code?: number; message?: string };
}

export interface RawGetTrackInfoResponse {
  code: number;
  data?: {
    accepted?: RawAcceptedItem[];
    rejected?: RawRejectedItem[];
  };
}

export interface ParsedTrackResult {
  trackingNumber: string;
  status: import('../types/shipment').ShipmentStatus;
  statusDescription: string | null;
  lastEventAt: number | null;
  events: import('../types/shipment').TrackingEvent[];
}
