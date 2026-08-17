import { generateId } from '../utils/id';
import type { NewShipmentInput, Shipment, ShipmentStatus, TrackingEvent } from '../types/shipment';
import { getDatabase } from './database';

interface ShipmentRow {
  id: string;
  tracking_number: string;
  carrier_id: string;
  label: string | null;
  created_at: number;
  notifications_enabled: number;
  status: string;
  status_description: string | null;
  last_event_at: number | null;
  last_checked_at: number | null;
  events_json: string;
}

function rowToShipment(row: ShipmentRow): Shipment {
  let events: TrackingEvent[] = [];
  try {
    events = JSON.parse(row.events_json);
  } catch {
    events = [];
  }
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    carrierId: row.carrier_id,
    label: row.label ?? undefined,
    createdAt: row.created_at,
    notificationsEnabled: row.notifications_enabled === 1,
    status: row.status as ShipmentStatus,
    statusDescription: row.status_description,
    lastEventAt: row.last_event_at,
    lastCheckedAt: row.last_checked_at,
    events,
  };
}

export async function getAllShipments(): Promise<Shipment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ShipmentRow>('SELECT * FROM shipments ORDER BY created_at DESC');
  return rows.map(rowToShipment);
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ShipmentRow>('SELECT * FROM shipments WHERE id = ?', id);
  return row ? rowToShipment(row) : null;
}

export async function insertShipment(input: NewShipmentInput): Promise<Shipment> {
  const db = await getDatabase();
  const shipment: Shipment = {
    id: generateId(),
    trackingNumber: input.trackingNumber.trim(),
    carrierId: input.carrierId,
    label: input.label?.trim() || undefined,
    createdAt: Date.now(),
    notificationsEnabled: true,
    status: 'unknown',
    statusDescription: null,
    lastEventAt: null,
    lastCheckedAt: null,
    events: [],
  };
  await db.runAsync(
    `INSERT INTO shipments
      (id, tracking_number, carrier_id, label, created_at, notifications_enabled, status, status_description, last_event_at, last_checked_at, events_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    shipment.id,
    shipment.trackingNumber,
    shipment.carrierId,
    shipment.label ?? null,
    shipment.createdAt,
    shipment.notificationsEnabled ? 1 : 0,
    shipment.status,
    shipment.statusDescription,
    shipment.lastEventAt,
    shipment.lastCheckedAt,
    JSON.stringify(shipment.events),
  );
  return shipment;
}

export async function deleteShipment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM shipments WHERE id = ?', id);
}

export async function setNotificationsEnabled(id: string, enabled: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE shipments SET notifications_enabled = ? WHERE id = ?', enabled ? 1 : 0, id);
}

export async function updateTrackingResult(
  id: string,
  result: {
    status: ShipmentStatus;
    statusDescription: string | null;
    lastEventAt: number | null;
    events: TrackingEvent[];
  },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE shipments
     SET status = ?, status_description = ?, last_event_at = ?, last_checked_at = ?, events_json = ?
     WHERE id = ?`,
    result.status,
    result.statusDescription,
    result.lastEventAt,
    Date.now(),
    JSON.stringify(result.events),
    id,
  );
}
