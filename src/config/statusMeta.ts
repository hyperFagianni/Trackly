import { colors } from '../theme/theme';
import type { ShipmentStatus } from '../types/shipment';

export const STATUS_META: Record<ShipmentStatus, { label: string; color: string }> = {
  unknown: { label: 'In attesa di dati', color: colors.neutral },
  info_received: { label: 'Informazioni ricevute', color: colors.neutral },
  in_transit: { label: 'In transito', color: colors.accent },
  pickup_available: { label: 'Pronto per il ritiro', color: colors.warning },
  out_for_delivery: { label: 'In consegna', color: colors.warning },
  delivered: { label: 'Consegnato', color: colors.success },
  exception: { label: 'Anomalia', color: colors.danger },
  expired: { label: 'Scaduto', color: colors.danger },
};
