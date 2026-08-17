import { buildStatusChangeNotification, hasStatusChanged, type StatusSnapshot } from '../statusDiff';

function snapshot(overrides: Partial<StatusSnapshot> = {}): StatusSnapshot {
  return {
    status: 'in_transit',
    lastEventAt: 1000,
    statusDescription: 'In transito',
    ...overrides,
  };
}

describe('hasStatusChanged', () => {
  it('returns false when status and last event timestamp are identical', () => {
    const previous = snapshot();
    const next = snapshot();
    expect(hasStatusChanged(previous, next)).toBe(false);
  });

  it('returns true when the normalized status changes', () => {
    const previous = snapshot({ status: 'in_transit' });
    const next = snapshot({ status: 'delivered', lastEventAt: 2000 });
    expect(hasStatusChanged(previous, next)).toBe(true);
  });

  it('returns true when the status is the same but a newer event appeared', () => {
    const previous = snapshot({ status: 'in_transit', lastEventAt: 1000 });
    const next = snapshot({ status: 'in_transit', lastEventAt: 2000 });
    expect(hasStatusChanged(previous, next)).toBe(true);
  });

  it('returns false when the next status is "unknown", regardless of previous state', () => {
    const previous = snapshot({ status: 'delivered', lastEventAt: 5000 });
    const next = snapshot({ status: 'unknown', lastEventAt: null });
    expect(hasStatusChanged(previous, next)).toBe(false);
  });

  it('returns false when next.lastEventAt is null even if status differs from a null-event previous', () => {
    const previous = snapshot({ status: 'in_transit', lastEventAt: null });
    const next = snapshot({ status: 'in_transit', lastEventAt: null });
    expect(hasStatusChanged(previous, next)).toBe(false);
  });

  it('treats a fresh shipment moving from unknown to a real status as a change worth notifying', () => {
    const previous = snapshot({ status: 'unknown', lastEventAt: null, statusDescription: null });
    const next = snapshot({ status: 'in_transit', lastEventAt: 1000 });
    expect(hasStatusChanged(previous, next)).toBe(true);
  });
});

describe('buildStatusChangeNotification', () => {
  it('uses the user-provided label as the title when present', () => {
    const content = buildStatusChangeNotification({
      carrierName: 'Poste Italiane',
      trackingNumber: 'AB123',
      label: 'Scarpe nuove',
      next: snapshot({ status: 'delivered', statusDescription: 'Consegnato al destinatario' }),
    });
    expect(content.title).toBe('Scarpe nuove');
    expect(content.body).toBe('Consegnato: Consegnato al destinatario');
  });

  it('falls back to carrier + tracking number when no label is set', () => {
    const content = buildStatusChangeNotification({
      carrierName: 'DHL',
      trackingNumber: 'XYZ789',
      next: snapshot({ status: 'out_for_delivery', statusDescription: null }),
    });
    expect(content.title).toBe('DHL · XYZ789');
    expect(content.body).toBe('In consegna');
  });
});
