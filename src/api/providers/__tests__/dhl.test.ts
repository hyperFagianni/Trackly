import { parseDhlResponse, type RawDhlTrackResponse } from '../dhl';

describe('parseDhlResponse', () => {
  it('extracts status, description and sorted events from a typical response', () => {
    const raw: RawDhlTrackResponse = {
      shipments: [
        {
          status: {
            timestamp: '2026-08-15T09:30:00',
            statusCode: 'delivered',
            description: 'Delivered',
          },
          events: [
            {
              timestamp: '2026-08-10T08:00:00',
              statusCode: 'pre-transit',
              description: 'Shipment information received',
              location: { address: { addressLocality: 'Roma' } },
            },
            {
              timestamp: '2026-08-15T09:30:00',
              statusCode: 'delivered',
              description: 'Delivered',
              location: { address: { addressLocality: 'Milano' } },
            },
          ],
        },
      ],
    };

    const result = parseDhlResponse(raw, 'JD0123456789');

    expect(result.status).toBe('delivered');
    expect(result.statusDescription).toBe('Delivered');
    expect(result.events).toHaveLength(2);
    expect(result.events[0].description).toBe('Delivered');
    expect(result.events[0].location).toBe('Milano');
    expect(result.lastEventAt).toBe(Date.parse('2026-08-15T09:30:00'));
  });

  it('infers out-for-delivery and pickup-available from the description text, since statusCode is coarse', () => {
    const outForDelivery = parseDhlResponse(
      { shipments: [{ status: { statusCode: 'transit', description: 'With delivery courier' } }] },
      'A',
    );
    expect(outForDelivery.status).toBe('out_for_delivery');

    const pickup = parseDhlResponse(
      { shipments: [{ status: { statusCode: 'transit', description: 'Ready for pickup at access point' } }] },
      'B',
    );
    expect(pickup.status).toBe('pickup_available');

    const failure = parseDhlResponse({ shipments: [{ status: { statusCode: 'failure', description: 'Delivery attempt failed' } }] }, 'C');
    expect(failure.status).toBe('exception');
  });

  it('degrades gracefully for an empty/malformed response', () => {
    const result = parseDhlResponse({}, 'X');
    expect(result.status).toBe('unknown');
    expect(result.statusDescription).toBeNull();
    expect(result.lastEventAt).toBeNull();
    expect(result.events).toEqual([]);
  });

  it('skips events with an unparsable timestamp or missing description', () => {
    const result = parseDhlResponse(
      {
        shipments: [
          {
            events: [
              { timestamp: 'not-a-date', description: 'Bad date' },
              { timestamp: '2026-08-01T00:00:00' },
              { timestamp: '2026-08-02T00:00:00', description: 'Valid event' },
            ],
          },
        ],
      },
      'X',
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0].description).toBe('Valid event');
  });
});
