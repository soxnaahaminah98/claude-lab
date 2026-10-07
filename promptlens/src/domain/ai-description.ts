import type { AssetDraft, AssetStatus } from './asset';
import { createEmptyAssetDraft } from './asset';
import type { AssetEquipmentType } from './equipment';

/**
 * Shape returned by the `describeAssetFromText` and `describeAssetFromImage`
 * Cloud Functions. Values use the backend's spelling (underscores, French
 * status names); `draftFromAiDescription` maps them to the domain's.
 */
const AI_EQUIPMENT_TYPES = [
  'laptop',
  'desktop',
  'printer',
  'receipt_printer',
  'smartphone',
  'network_device',
  'other',
] as const;

const AI_STATUSES = ['en_service', 'en_stock', 'en_panne', 'en_reparation', 'retire'] as const;

type AiEquipmentType = (typeof AI_EQUIPMENT_TYPES)[number];
type AiStatus = (typeof AI_STATUSES)[number];

export interface AiAssetDescription {
  equipmentType: AiEquipmentType | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  assetTag: string | null;
  suggestedStatus: AiStatus | null;
  /** French sentence, empty when no problem was reported. */
  issueSummary: string;
  /** 0 to 1. */
  confidence: number;
}

const TYPE_MAP: Record<AiEquipmentType, AssetEquipmentType> = {
  laptop: 'laptop',
  desktop: 'desktop',
  printer: 'printer',
  receipt_printer: 'receipt-printer',
  smartphone: 'smartphone',
  network_device: 'network-device',
  other: 'other',
};

const STATUS_MAP: Record<AiStatus, AssetStatus> = {
  en_service: 'in-service',
  en_stock: 'in-stock',
  en_panne: 'broken',
  en_reparation: 'in-repair',
  retire: 'retired',
};

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/** Check an untrusted callable response. Returns null when it does not have the expected shape. */
export function parseAiDescription(value: unknown): AiAssetDescription | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;

  const { equipmentType, suggestedStatus, issueSummary, confidence } = v;
  if (equipmentType !== null && !isOneOf(AI_EQUIPMENT_TYPES, equipmentType)) return null;
  if (suggestedStatus !== null && !isOneOf(AI_STATUSES, suggestedStatus)) return null;
  if (typeof issueSummary !== 'string') return null;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return null;
  if (!isNullableString(v.brand) || !isNullableString(v.model)) return null;
  if (!isNullableString(v.serialNumber) || !isNullableString(v.assetTag)) return null;

  return {
    equipmentType,
    brand: v.brand,
    model: v.model,
    serialNumber: v.serialNumber,
    assetTag: v.assetTag,
    suggestedStatus,
    issueSummary,
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}

/** Form fields the AI can leave empty. */
export type AiFillableField = 'equipmentType' | 'brand' | 'modelLabel' | 'serialNumber' | 'assetTag' | 'status';

export interface AiDraft {
  draft: AssetDraft;
  /** Fields the AI returned as null: shown empty and flagged "À compléter". */
  toComplete: AiFillableField[];
}

function blankToNull(value: string | null): string | null {
  return value === null || value.trim() === '' ? null : value.trim();
}

/**
 * Turn an AI description into a form draft. A null stays empty: nothing is
 * guessed, and the field is listed in `toComplete`. The issue summary goes to
 * the notes; an empty summary is normal and is not "to complete".
 */
export function draftFromAiDescription(description: AiAssetDescription, site = ''): AiDraft {
  const brand = blankToNull(description.brand);
  const modelLabel = blankToNull(description.model);
  const serialNumber = blankToNull(description.serialNumber);
  const assetTag = blankToNull(description.assetTag);

  const draft: AssetDraft = {
    ...createEmptyAssetDraft(),
    equipmentType: description.equipmentType ? TYPE_MAP[description.equipmentType] : '',
    brand: brand ?? '',
    modelLabel: modelLabel ?? '',
    serialNumber: serialNumber ?? '',
    assetTag: assetTag ?? '',
    status: description.suggestedStatus ? STATUS_MAP[description.suggestedStatus] : '',
    notes: description.issueSummary.trim(),
    site,
  };

  const toComplete: AiFillableField[] = [];
  if (draft.equipmentType === '') toComplete.push('equipmentType');
  if (brand === null) toComplete.push('brand');
  if (modelLabel === null) toComplete.push('modelLabel');
  if (serialNumber === null) toComplete.push('serialNumber');
  if (assetTag === null) toComplete.push('assetTag');
  if (draft.status === '') toComplete.push('status');

  return { draft, toComplete };
}

/** True when nothing identifying could be read: no brand, model, serial number or asset tag. */
export function isUnreadable(description: AiAssetDescription): boolean {
  return (
    blankToNull(description.brand) === null &&
    blankToNull(description.model) === null &&
    blankToNull(description.serialNumber) === null &&
    blankToNull(description.assetTag) === null
  );
}
