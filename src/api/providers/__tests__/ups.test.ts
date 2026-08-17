import { parseUpsResponse, type RawUpsTrackResponse } from '../ups';

describe('parseUpsResponse', () => {
  it('extracts status, description and sorted events from a typical response', () => {
    const raw: RawUpsTrackResponse = {
      trackResponse: {
        shipment: [
          {
            package: [
              {
                trackingNumber: '1Z999AA10123456784',
                currentStatus: { code: '011', description: 'Delivered', type: 'D' },
                activity: [
                  {
                    date: '20260810',
                    time: '080000',
                    status: { description: 'Order Processed: Ready for UPS', type: 'M' },
                    location: { address: { city: 'Roma', countryCode: 'IT' } },
                  },
                  {
                    date: '20260815',
                    time: '093000',
                    status: { description: 'Delivered', type: 'D' },
                    location: { address: { city: 'Milano', countryCode: 'IT' } },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = parseUpsResponse(raw, '1Z999AA10123456784');

    expect(result.status).toBe('delivered');
    expect(result.statusDescription).toBe('Delivered');
    expect(result.events).toHaveLength(2);
    // most recent first
    expect(result.events[0].description).toBe('Delivered');
    expect(result.events[0].location).toBe('Milano, IT');
    expect(result.events[1].description).toBe('Order Processed: Ready for UPS');
    expect(result.lastEventAt).toBe(result.events[0].timestamp);
  });

  it('maps out-for-delivery and exception hints from the description text', () => {
    const outForDelivery = parseUpsResponse(
      {
        trackResponse: {
          shipment: [
            {
              package: [
                {
                  currentStatus: { description: 'Out For Delivery Today', type: 'I' },
                  activity: [],
                },
              ],
            },
          ],
        },
      },
      'X1',
    );
    expect(outForDelivery.status).toBe('out_for_delivery');

    const exception = parseUpsResponse(
      {
        trackResponse: {
          shipment: [{ package: [{ currentStatus: { description: 'Exception', type: 'X' }, activity: [] }] }],
        },
      },
      'X2',
    );
    expect(exception.status).toBe('exception');
  });

  it('degrades gracefully for an empty/malformed response', () => {
    const result = parseUpsResponse({}, 'X3');
    expect(result.status).toBe('unknown');
    expect(result.statusDescription).toBeNull();
    expect(result.lastEventAt).toBeNull();
    expect(result.events).toEqual([]);
  });

  it('skips activity entries with an unparsable date or missing description', () => {
    const result = parseUpsResponse(
      {
        trackResponse: {
          shipment: [
            {
              package: [
                {
                  activity: [
                    { date: 'bad', time: '000000', status: { description: 'Bad date' } },
                    { date: '20260101', time: '120000', status: {} },
                    { date: '20260102', time: '120000', status: { description: 'Valid event' } },
                  ],
                },
              ],
            },
          ],
        },
      },
      'X4',
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0].description).toBe('Valid event');
  });
});
