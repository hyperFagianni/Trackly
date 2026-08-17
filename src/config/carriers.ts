import type { ImageSourcePropType } from 'react-native';

/**
 * Curated list of carriers for the MVP. Extending Trackly to a new carrier only
 * requires adding an entry here (plus a local logo asset) — nothing else in the
 * app hardcodes carrier identity.
 *
 * `trackingApiCarrierCode` is the numeric carrier code used by the 17TRACK API
 * (see https://res.17track.net/asset/carrier/info/apicarrier.all.json). These
 * were cross-checked against that reference file on 2026-08-17; 17TRACK updates
 * it periodically, so re-verify before relying on it for a carrier not listed
 * here.
 */
export interface Carrier {
  id: string;
  name: string;
  trackingApiCarrierCode: number;
  color: string;
  logo: ImageSourcePropType;
}

export const CARRIERS: Carrier[] = [
  {
    id: 'poste_italiane',
    name: 'Poste Italiane',
    trackingApiCarrierCode: 9071,
    color: '#FFCC00',
    logo: require('../../assets/carriers/poste_italiane.png'),
  },
  {
    id: 'brt',
    name: 'BRT (Bartolini)',
    trackingApiCarrierCode: 100026,
    color: '#E4032E',
    logo: require('../../assets/carriers/brt.png'),
  },
  {
    id: 'gls',
    name: 'GLS',
    trackingApiCarrierCode: 100024,
    color: '#0016A8',
    logo: require('../../assets/carriers/gls.png'),
  },
  {
    id: 'sda',
    name: 'SDA Express Courier',
    trackingApiCarrierCode: 100019,
    color: '#1E6DB5',
    logo: require('../../assets/carriers/sda.png'),
  },
  {
    id: 'dhl',
    name: 'DHL',
    trackingApiCarrierCode: 100001,
    color: '#FFCC00',
    logo: require('../../assets/carriers/dhl.png'),
  },
  {
    id: 'ups',
    name: 'UPS',
    trackingApiCarrierCode: 100002,
    color: '#341A02',
    logo: require('../../assets/carriers/ups.png'),
  },
  {
    id: 'fedex',
    name: 'FedEx',
    trackingApiCarrierCode: 100003,
    color: '#4D148C',
    logo: require('../../assets/carriers/fedex.png'),
  },
  {
    id: 'tnt',
    name: 'TNT',
    trackingApiCarrierCode: 100004,
    color: '#FF6200',
    logo: require('../../assets/carriers/tnt.png'),
  },
  {
    id: 'amazon_logistics',
    name: 'Amazon Logistics',
    trackingApiCarrierCode: 100308,
    color: '#FF9900',
    logo: require('../../assets/carriers/amazon.png'),
  },
];

const CARRIERS_BY_ID = new Map(CARRIERS.map((carrier) => [carrier.id, carrier]));

export function getCarrierById(id: string): Carrier | undefined {
  return CARRIERS_BY_ID.get(id);
}

export function getCarrierByApiCode(code: number): Carrier | undefined {
  return CARRIERS.find((carrier) => carrier.trackingApiCarrierCode === code);
}
