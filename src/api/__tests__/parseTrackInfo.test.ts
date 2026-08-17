import { mapApiStatus, parseAcceptedItem, parseGetTrackInfoResponse } from '../parseTrackInfo';
import type { RawGetTrackInfoResponse } from '../types';

describe('mapApiStatus', () => {
  it('maps known 17TRACK statuses to internal ShipmentStatus values', () => {
    expect(mapApiStatus('InTransit')).toBe('in_transit');
    expect(mapApiStatus('Delivered')).toBe('delivered');
    expect(mapApiStatus('OutForDelivery')).toBe('out_for_delivery');
    expect(mapApiStatus('AvailableForPickup')).toBe('pickup_available');
    expect(mapApiStatus('InfoReceived')).toBe('info_received');
    expect(mapApiStatus('Expired')).toBe('expired');
    expect(mapApiStatus('DeliveryFailure')).toBe('exception');
    expect(mapApiStatus('Exception')).toBe('exception');
  });

  it('is case-insensitive and ignores separators', () => {
    expect(mapApiStatus('in_transit')).toBe('in_transit');
    expect(mapApiStatus('IN-TRANSIT')).toBe('in_transit');
  });

  it('falls back to unknown for unrecognized or missing statuses', () => {
    expect(mapApiStatus('SomethingNew')).toBe('unknown');
    expect(mapApiStatus(undefined)).toBe('unknown');
    expect(mapApiStatus(null)).toBe('unknown');
    expect(mapApiStatus('')).toBe('unknown');
  });
});

describe('parseAcceptedItem', () => {
  it('extracts status, description, sorted events and latest event timestamp', () => {
    const result = parseAcceptedItem({
      number: 'AB123456789IT',
      carrier: 100001,
      track_info: {
        latest_status: { status: 'InTransit' },
        latest_event: {
          time_iso: '2026-08-15T09:30:00+02:00',
          description: 'Il pacco è in transito',
          location: 'Milano, IT',
        },
        tracking: {
          providers: [
            {
              events: [
                {
                  time_iso: '2026-08-10T08:00:00+02:00',
                  description: 'Spedizione presa in carico',
                  location: 'Roma, IT',
                },
                {
                  time_iso: '2026-08-15T09:30:00+02:00',
                  description: 'Il pacco è in transito',
                  location: 'Milano, IT',
                },
              ],
            },
          ],
        },
      },
    });

    expect(result.trackingNumber).toBe('AB123456789IT');
    expect(result.status).toBe('in_transit');
    expect(result.statusDescription).toBe('Il pacco è in transito');
    // events must be sorted most-recent-first
    expect(result.events).toHaveLength(2);
    expect(result.events[0].description).toBe('Il pacco è in transito');
    expect(result.events[1].description).toBe('Spedizione presa in carico');
    expect(result.lastEventAt).toBe(Date.parse('2026-08-15T09:30:00+02:00'));
  });

  it('degrades to unknown status and empty events for a bare/empty track_info', () => {
    const result = parseAcceptedItem({ number: 'X1', carrier: 100002, track_info: undefined });
    expect(result.status).toBe('unknown');
    expect(result.statusDescription).toBeNull();
    expect(result.lastEventAt).toBeNull();
    expect(result.events).toEqual([]);
  });

  it('skips malformed events (missing description or unparsable timestamp) without throwing', () => {
    const result = parseAcceptedItem({
      number: 'X2',
      carrier: 100002,
      track_info: {
        tracking: {
          providers: [
            {
              events: [
                { time_iso: 'not-a-date', description: 'Evento con data non valida' },
                { time_iso: '2026-08-01T00:00:00Z' } as any, // missing description
                { time_iso: '2026-08-02T00:00:00Z', description: 'Evento valido' },
              ],
            },
          ],
        },
      },
    });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].description).toBe('Evento valido');
  });
});

describe('parseGetTrackInfoResponse', () => {
  it('parses multiple accepted items into a map keyed by tracking number', () => {
    const raw: RawGetTrackInfoResponse = {
      code: 0,
      data: {
        accepted: [
          {
            number: 'A1',
            carrier: 100001,
            track_info: { latest_status: { status: 'Delivered' } },
          },
          {
            number: 'A2',
            carrier: 100002,
            track_info: { latest_status: { status: 'InTransit' } },
          },
        ],
        rejected: [{ number: 'BAD', error: { code: 1, message: 'not found' } }],
      },
    };

    const result = parseGetTrackInfoResponse(raw);
    expect(result.size).toBe(2);
    expect(result.get('A1')?.status).toBe('delivered');
    expect(result.get('A2')?.status).toBe('in_transit');
    expect(result.has('BAD')).toBe(false);
  });

  it('handles a missing/empty response gracefully', () => {
    expect(parseGetTrackInfoResponse(null).size).toBe(0);
    expect(parseGetTrackInfoResponse({ code: 0 }).size).toBe(0);
  });
});
