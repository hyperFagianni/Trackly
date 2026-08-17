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
 *   there's no live status or automatic notifications — opening one builds
 *   a deep link into that carrier's own public tracking page instead
 *   (`buildTrackingUrl`), pre-filled with the tracking number wherever that
 *   carrier's site supports it via URL.
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
  /**
   * Builds the URL to open for a given tracking number. For most carriers
   * this deep-links straight to the result (verified 2026-08-17 — either by
   * a direct test, e.g. Poste Italiane, or by inspecting the carrier's own
   * page for a query param its search form actually reads on load). A few
   * carriers don't support this at all (see `deepLinkSupported`): their
   * search only works via an in-page form POST, so this just returns the
   * plain search page and the app relies on copy-to-clipboard instead.
   */
  buildTrackingUrl: (trackingNumber: string) => string;
  /** False when buildTrackingUrl can only return the plain search page (no working prefill) — see per-carrier comments below. */
  deepLinkSupported: boolean;
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
    // Confirmed directly by hand: opens straight to the shipment's result.
    buildTrackingUrl: (n) => `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(n)}`,
    deepLinkSupported: true,
    logo: require('../../assets/carriers/poste_italiane.png'),
  },
  {
    id: 'brt',
    name: 'BRT (Bartolini)',
    trackingMode: 'external',
    // "nspediz" confirmed via BRT-integration API docs showing this exact
    // tracking_link format (https://vas.brt.it/vas/sped_det_show.hsm?nspediz=...).
    buildTrackingUrl: (n) => `https://vas.brt.it/vas/sped_det_show.hsm?nspediz=${encodeURIComponent(n)}`,
    deepLinkSupported: true,
    logo: require('../../assets/carriers/brt.png'),
  },
  {
    id: 'gls',
    name: 'GLS',
    trackingMode: 'external',
    // GLS's search form POSTs (method="post", no query-string reader on
    // load) — no URL can pre-fill it, confirmed by inspecting the page.
    // Plain search page; the app still copies the number to the clipboard.
    buildTrackingUrl: () => 'https://www.gls-italy.com/it/servizi-per-destinatari/ricerca-spedizione/',
    deepLinkSupported: false,
    logo: require('../../assets/carriers/gls.png'),
  },
  {
    id: 'sda',
    name: 'SDA Express Courier',
    trackingMode: 'external',
    // SDA's own tracking now redirects into Poste Italiane's system (SDA is
    // part of the Poste group) — same deep-link pattern as Poste.
    buildTrackingUrl: (n) => `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(n)}`,
    deepLinkSupported: true,
    note: 'SDA fa parte del gruppo Poste Italiane: il tracciamento passa dal sito Poste.',
    logo: require('../../assets/carriers/sda.png'),
  },
  {
    id: 'tnt',
    name: 'TNT',
    trackingMode: 'external',
    // TNT is now run on FedEx's network/site — "trknbr" is FedEx's
    // long-standing tracking URL parameter.
    buildTrackingUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
    deepLinkSupported: true,
    note: 'TNT è stata assorbita dalla rete FedEx: il tracciamento oggi passa dal sito FedEx.',
    logo: require('../../assets/carriers/tnt.png'),
  },
  {
    id: 'amazon_logistics',
    name: 'Amazon Logistics',
    trackingMode: 'external',
    // No public per-code tracking page exists at all — tracking only lives
    // inside your own Amazon account's order history.
    buildTrackingUrl: () => 'https://www.amazon.it/gp/css/order-history',
    deepLinkSupported: false,
    note: 'Amazon non offre una pagina di tracciamento pubblica per codice: serve accedere al tuo account Amazon.',
    logo: require('../../assets/carriers/amazon.png'),
  },
  {
    id: 'inpost',
    name: 'InPost',
    trackingMode: 'external',
    // "number" confirmed: InPost's site (Drupal) round-trips this query
    // param through its own routing, and it matches the search field's name.
    buildTrackingUrl: (n) => `https://inpost.it/trova-il-tuo-pacco?number=${encodeURIComponent(n)}`,
    deepLinkSupported: true,
    logo: require('../../assets/carriers/inpost.png'),
  },
  {
    id: 'vinted_go',
    name: 'Vinted Go',
    trackingMode: 'external',
    // "trackingNumber" matches the search field's name/id exactly; not
    // independently confirmed to auto-submit like the others above.
    buildTrackingUrl: (n) => `https://vintedgo.com/en/tracking?trackingNumber=${encodeURIComponent(n)}`,
    deepLinkSupported: true,
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
