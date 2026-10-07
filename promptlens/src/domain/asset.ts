import type { CatalogueModel } from './equipment';
import type { AssetEquipmentType } from './equipment';

export const ASSET_STATUSES = ['in-service', 'in-stock', 'broken', 'in-repair', 'retired'] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export function isAssetStatus(value: unknown): value is AssetStatus {
  return typeof value === 'string' && (ASSET_STATUSES as readonly string[]).includes(value);
}

/** One physical unit logged for a site. */
export interface Asset {
  id: string;
  /** Catalogue model this asset was created from, or an empty string for a custom entry. */
  modelId: string;
  equipmentType: AssetEquipmentType;
  /** Free text. Copied from the catalogue model when one is chosen, and always editable. */
  brand: string;
  /** Free text, same rules as `brand`. */
  modelLabel: string;
  site: string;
  assetTag: string;
  serialNumber: string;
  status: AssetStatus;
  /** Free text; may name a person or a room. */
  assignedTo: string;
  /** ISO date `YYYY-MM-DD`, or an empty string when unknown. */
  purchaseDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetInput = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Form state for an asset that is not saved yet. Unlike `AssetInput`, the type
 * and the status can be empty: a value the AI could not read stays empty
 * instead of being guessed.
 */
export interface AssetDraft extends Omit<AssetInput, 'equipmentType' | 'status'> {
  equipmentType: AssetEquipmentType | '';
  status: AssetStatus | '';
}

export function createEmptyAssetDraft(): AssetDraft {
  return {
    modelId: '',
    equipmentType: '',
    brand: '',
    modelLabel: '',
    site: '',
    assetTag: '',
    serialNumber: '',
    status: 'in-stock',
    assignedTo: '',
    purchaseDate: '',
    notes: '',
  };
}

/** Fill type, brand and model label from a catalogue model. An empty model id clears only the link. */
export function applyCatalogueModel(draft: AssetDraft, model: CatalogueModel | undefined): AssetDraft {
  if (!model) return { ...draft, modelId: '' };
  return {
    ...draft,
    modelId: model.id,
    equipmentType: model.type,
    brand: model.brand,
    modelLabel: model.modelLabel,
  };
}

export function draftFromAsset(asset: Asset): AssetDraft {
  return {
    modelId: asset.modelId,
    equipmentType: asset.equipmentType,
    brand: asset.brand,
    modelLabel: asset.modelLabel,
    site: asset.site,
    assetTag: asset.assetTag,
    serialNumber: asset.serialNumber,
    status: asset.status,
    assignedTo: asset.assignedTo,
    purchaseDate: asset.purchaseDate,
    notes: asset.notes,
  };
}

/**
 * Start a new asset from an existing one. The fields that identify a single
 * physical unit (tag, serial number, assignee) are cleared.
 */
export function toDuplicateDraft(asset: Asset): AssetDraft {
  return { ...draftFromAsset(asset), assetTag: '', serialNumber: '', assignedTo: '' };
}

export type AssetField = 'equipmentType' | 'site' | 'assetTag' | 'status' | 'purchaseDate';
export type AssetErrorCode = 'required' | 'invalid-date' | 'future-date';
export type AssetErrors = Partial<Record<AssetField, AssetErrorCode>>;

export type DraftResult = { ok: true; input: AssetInput } | { ok: false; errors: AssetErrors };

/**
 * Validate a draft and, when it is complete, return the trimmed asset input.
 * `today` is injected as `YYYY-MM-DD` so the function stays pure.
 */
export function parseAssetDraft(draft: AssetDraft, today: string): DraftResult {
  const errors: AssetErrors = {};

  if (draft.equipmentType === '') errors.equipmentType = 'required';
  if (!draft.site.trim()) errors.site = 'required';
  if (!draft.assetTag.trim()) errors.assetTag = 'required';
  if (draft.status === '') errors.status = 'required';

  if (draft.purchaseDate) {
    if (!isValidIsoDate(draft.purchaseDate)) errors.purchaseDate = 'invalid-date';
    else if (draft.purchaseDate > today) errors.purchaseDate = 'future-date';
  }

  if (Object.keys(errors).length > 0 || draft.equipmentType === '' || draft.status === '') {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      modelId: draft.modelId,
      equipmentType: draft.equipmentType,
      brand: draft.brand.trim(),
      modelLabel: draft.modelLabel.trim(),
      site: draft.site.trim(),
      assetTag: draft.assetTag.trim(),
      serialNumber: draft.serialNumber.trim(),
      status: draft.status,
      assignedTo: draft.assignedTo.trim(),
      purchaseDate: draft.purchaseDate,
      notes: draft.notes.trim(),
    },
  };
}

export interface DuplicateWarning {
  field: 'assetTag' | 'serialNumber';
  /** The asset that already uses this value. */
  existing: Asset;
}

function sameValue(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Assets that already use this asset tag or serial number. This only warns:
 * saving anyway stays possible. Blank values never match, and the asset being
 * edited is ignored.
 */
export function findDuplicates(
  values: Pick<AssetInput, 'assetTag' | 'serialNumber'>,
  existing: readonly Asset[],
  editingId?: string,
): DuplicateWarning[] {
  const others = existing.filter((asset) => asset.id !== editingId);
  const warnings: DuplicateWarning[] = [];

  if (values.assetTag.trim()) {
    const match = others.find((asset) => sameValue(asset.assetTag, values.assetTag));
    if (match) warnings.push({ field: 'assetTag', existing: match });
  }
  if (values.serialNumber.trim()) {
    const match = others.find((asset) => sameValue(asset.serialNumber, values.serialNumber));
    if (match) warnings.push({ field: 'serialNumber', existing: match });
  }
  return warnings;
}

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Local calendar date as `YYYY-MM-DD`. */
export function todayIsoDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Purchase date plus warranty months, clamping to the end of shorter months. */
export function warrantyEndDate(purchaseDate: string, months: number): string | null {
  if (!isValidIsoDate(purchaseDate)) return null;
  const [year = 0, month = 1, day = 1] = purchaseDate.split('-').map(Number);
  const total = month - 1 + months;
  const endYear = year + Math.floor(total / 12);
  const endMonth = total % 12;
  const lastDay = new Date(Date.UTC(endYear, endMonth + 1, 0)).getUTCDate();
  const endDay = Math.min(day, lastDay);
  return `${String(endYear).padStart(4, '0')}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}

export function isWarrantyExpired(endDate: string, today: string): boolean {
  return endDate < today;
}

/** Information that makes an inventory record usable, even though it is not needed to save it. */
export type MissingAssetField = 'serialNumber' | 'model';

/**
 * What is still missing from a saved asset: its serial number, and any
 * indication of what it is (brand or model). Empty when the record is complete.
 */
export function missingAssetFields(
  asset: Pick<Asset, 'serialNumber' | 'brand' | 'modelLabel'>,
): MissingAssetField[] {
  const missing: MissingAssetField[] = [];
  if (!asset.serialNumber.trim()) missing.push('serialNumber');
  if (!asset.brand.trim() && !asset.modelLabel.trim()) missing.push('model');
  return missing;
}
