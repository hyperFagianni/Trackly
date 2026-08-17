import type { ImageSourcePropType } from 'react-native';

/**
 * Curated list of carriers. Extending Trackly to a new carrier only requires
 * adding an entry here (plus a local logo asset) — nothing else in the app
 * hardcodes carrier identity.
 *
 * Two tracking modes, because only a few carriers offer a genuinely free,
 * self-serve tracking API (no business/shipping contract required):
 *
 * - `api`: live status fetched directly from the carrier's own API, drives
 *   automatic notifications. Currently UPS, FedEx and DHL — confirmed via
 *   their public developer portals (developer.ups.com, developer.fedex.com,
 *   developer.dhl.com) to allow individual self-registration without an
 *   existing shipping contract, as of 2026-08-17.
 * - `external`: no accessible free API exists for this carrier without a
 *   business/contract account (Poste Italiane, BRT, GLS, SDA, Amazon
 *   Logistics, InPost, Vinted Go all confirmed to require one — see
 *   README "Dati di tracciamento"). These shipments still live in Trackly's
 *   list (add/rename/delete, carrier logo, swipe-to-delete all work), but
 *   there's no live status or automatic notifications — opening one offers
 *   a shortcut to the carrier's own public tracking page instead.
 */
export type ApiProvider = 'ups' | 'fedex' | 'dhl';

interface CarrierCommon {
  id: string;
  name: string;
  logo: ImageSourcePropType;
}

export interface ApiCarrier extends CarrierCommon {
  trackingMode: 'api';
  apiProvider: ApiProvider;
}

export interface ExternalCarrier extends CarrierCommon {
  trackingMode: 'external';
  /** Carrier's own public tracking page. No query-param prefill is assumed reliable across these (several are JS/SPA search forms) — the app copies the tracking number to the clipboard and opens this URL, and the user pastes it. */
  externalTrackingUrl: string;
  /** Short note shown in the UI explaining why there's no live tracking, when it's not simply "no free API". */
  note?: string;
}

export type Carrier = ApiCarrier | ExternalCarrier;

export const CARRIERS: Carrier[] = [
  {
    id: 'ups',
    name: 'UPS',
    trackingMode: 'api',
    apiProvider: 'ups',
    logo: require('../../assets/carriers/ups.png'),
  },
  {
    id: 'fedex',
    name: 'FedEx',
    trackingMode: 'api',
    apiProvider: 'fedex',
    logo: require('../../assets/carriers/fedex.png'),
  },
  {
    id: 'dhl',
    name: 'DHL',
    trackingMode: 'api',
    apiProvider: 'dhl',
    logo: require('../../assets/carriers/dhl.png'),
  },
  {
    id: 'poste_italiane',
    name: 'Poste Italiane',
    trackingMode: 'external',
    externalTrackingUrl: 'https://www.poste.it/',
    logo: require('../../assets/carriers/poste_italiane.png'),
  },
  {
    id: 'brt',
    name: 'BRT (Bartolini)',
    trackingMode: 'external',
    externalTrackingUrl: 'https://vas.brt.it/vas/sped_det_show',
    logo: require('../../assets/carriers/brt.png'),
  },
  {
    id: 'gls',
    name: 'GLS',
    trackingMode: 'external',
    externalTrackingUrl: 'https://www.gls-italy.com/it/servizi-per-destinatari/ricerca-spedizione/',
    logo: require('../../assets/carriers/gls.png'),
  },
  {
    id: 'sda',
    name: 'SDA Express Courier',
    trackingMode: 'external',
    externalTrackingUrl: 'https://www.sda.it/',
    logo: require('../../assets/carriers/sda.png'),
  },
  {
    id: 'tnt',
    name: 'TNT',
    trackingMode: 'external',
    externalTrackingUrl: 'https://www.fedex.com/fedextrack/',
    note: 'TNT è stata assorbita dalla rete FedEx: il tracciamento oggi passa dal sito FedEx.',
    logo: require('../../assets/carriers/tnt.png'),
  },
  {
    id: 'amazon_logistics',
    name: 'Amazon Logistics',
    trackingMode: 'external',
    externalTrackingUrl: 'https://www.amazon.it/gp/css/order-history',
    note: 'Amazon non offre una pagina di tracciamento pubblica per codice: serve accedere al tuo account Amazon.',
    logo: require('../../assets/carriers/amazon.png'),
  },
  {
    id: 'inpost',
    name: 'InPost',
    trackingMode: 'external',
    externalTrackingUrl: 'https://inpost.it/trova-il-tuo-pacco',
    logo: require('../../assets/carriers/inpost.png'),
  },
  {
    id: 'vinted_go',
    name: 'Vinted Go',
    trackingMode: 'external',
    externalTrackingUrl: 'https://vintedgo.com/en/tracking',
    logo: require('../../assets/carriers/vinted_go.png'),
  },
];

const CARRIERS_BY_ID = new Map(CARRIERS.map((carrier) => [carrier.id, carrier]));

export function getCarrierById(id: string): Carrier | undefined {
  return CARRIERS_BY_ID.get(id);
}

export function isApiCarrier(carrier: Carrier): carrier is ApiCarrier {
  return carrier.trackingMode === 'api';
}
