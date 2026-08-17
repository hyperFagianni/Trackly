/**
 * Central switch for the (currently unused) ad slot. Flip to `true` once an ad
 * SDK/sponsor content is actually wired into <AdSlot />, and see the README
 * for the GDPR consent requirements that come with that.
 */
export const ADS_ENABLED = false;

export interface AdSlotConfig {
  enabled: boolean;
  placementId?: string;
}

export const AD_SLOT_CONFIG: AdSlotConfig = {
  enabled: ADS_ENABLED,
  placementId: undefined,
};
