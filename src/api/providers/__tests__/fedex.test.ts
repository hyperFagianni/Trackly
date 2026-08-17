import { parseFedexResponse, type RawFedexTrackResponse } from '../fedex';

describe('parseFedexResponse', () => {
  it('extracts status, description and sorted events from a typical response', () => {
    const raw: RawFedexTrackResponse = {
      output: {
        completeTrackResults: [
          {
            trackingNumber: '999999999999',
            trackResults: [
              {
                latestStatusDetail: { derivedCode: 'DL', description: 'Delivered' },
                scanEvents: [
                  {
                    date: '2026-08-10T08:00:00+02:00',
                    derivedStatusCode: 'PU',
                    eventDescription: 'Picked up',
                    scanLocation: { city: 'Roma', countryCode: 'IT' },
                  },
                  {
                    date: '2026-08-15T09:30:00+02:00',
                    derivedStatusCode: 'DL',
                    eventDescription: 'Delivered',
                    scanLocation: { city: 'Milano', countryCode: 'IT' },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = parseFedexResponse(raw, '999999999999');

    expect(result.status).toBe('delivered');
    expect(result.statusDescription).toBe('Delivered');
    expect(result.events).toHaveLength(2);
    expect(result.events[0].description).toBe('Delivered');
    expect(result.events[0].location).toBe('Milano, IT');
    expect(result.lastEventAt).toBe(Date.parse('2026-08-15T09:30:00+02:00'));
  });

  it('maps the known FedEx derived status codes', () => {
    const build = (code: string): RawFedexTrackResponse => ({
      output: {
        completeTrackResults: [
          { trackResults: [{ latestStatusDetail: { derivedCode: code, description: code } }] },
        ],
      },
    });

    expect(parseFedexResponse(build('OD'), 'A').status).toBe('out_for_delivery');
    expect(parseFedexResponse(build('IT'), 'A').status).toBe('in_transit');
    expect(parseFedexResponse(build('OC'), 'A').status).toBe('info_received');
    expect(parseFedexResponse(build('DE'), 'A').status).toBe('exception');
    expect(parseFedexResponse(build('SOMETHING_NEW'), 'A').status).toBe('unknown');
  });

  it('degrades gracefully for an empty/malformed response', () => {
    const result = parseFedexResponse({}, 'X');
    expect(result.status).toBe('unknown');
    expect(result.statusDescription).toBeNull();
    expect(result.lastEventAt).toBeNull();
    expect(result.events).toEqual([]);
  });

  it('skips scan events with an unparsable date or missing description', () => {
    const result = parseFedexResponse(
      {
        output: {
          completeTrackResults: [
            {
              trackResults: [
                {
                  scanEvents: [
                    { date: 'not-a-date', eventDescription: 'Bad date' },
                    { date: '2026-08-01T00:00:00Z' },
                    { date: '2026-08-02T00:00:00Z', eventDescription: 'Valid event' },
                  ],
                },
              ],
            },
          ],
        },
      },
      'X',
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0].description).toBe('Valid event');
  });
});
