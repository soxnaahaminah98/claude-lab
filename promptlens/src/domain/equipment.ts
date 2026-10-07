export const EQUIPMENT_TYPES = [
  'laptop',
  'desktop',
  'printer',
  'receipt-printer',
  'smartphone',
  'network-device',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

/** Types an asset can have: the catalogue types, plus anything else (e.g. from an AI description). */
export const ASSET_EQUIPMENT_TYPES = [...EQUIPMENT_TYPES, 'other'] as const;

export type AssetEquipmentType = (typeof ASSET_EQUIPMENT_TYPES)[number];

export function isAssetEquipmentType(value: unknown): value is AssetEquipmentType {
  return typeof value === 'string' && (ASSET_EQUIPMENT_TYPES as readonly string[]).includes(value);
}

/** One inline icon per asset type (see components/TypeIcon.tsx). */
export type IconKey = AssetEquipmentType;

/** A generic, built-in example model. Never a real purchased unit. */
export interface CatalogueModel {
  id: string;
  type: EquipmentType;
  brand: string;
  /** Generic description, deliberately not a real model number. */
  modelLabel: string;
  typicalUse: string;
  warrantyMonths: number;
  icon: IconKey;
}
