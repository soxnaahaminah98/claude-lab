import { z } from 'zod';

export const EQUIPMENT_TYPES = [
  'laptop',
  'desktop',
  'printer',
  'receipt_printer',
  'smartphone',
  'network_device',
  'other',
] as const;

export const SUGGESTED_STATUSES = ['en_service', 'en_stock', 'en_panne', 'en_reparation', 'retire'] as const;

/** Shape of what the model returns, before server-side normalisation. */
const modelOutputSchema = z.strictObject({
  equipmentType: z.enum(EQUIPMENT_TYPES).nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  serialNumber: z.string().nullable(),
  assetTag: z.string().nullable(),
  suggestedStatus: z.enum(SUGGESTED_STATUSES).nullable(),
  issueSummary: z.string(),
  confidence: z.number(),
});

/** Shape returned to callers: same as the model output, with confidence in [0, 1]. */
export const assetDescriptionSchema = modelOutputSchema.extend({
  confidence: z.number().min(0).max(1),
});

export type AssetDescription = z.infer<typeof assetDescriptionSchema>;

export function parseModelOutput(value: unknown): z.infer<typeof modelOutputSchema> | null {
  const result = modelOutputSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** JSON schema sent to Gemini. Must stay in sync with the zod schema (see tests). */
export const ASSET_DESCRIPTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    equipmentType: {
      type: ['string', 'null'],
      enum: [...EQUIPMENT_TYPES, null],
      description: 'Kind of equipment. "other" if it is something else, null if it cannot be determined.',
    },
    brand: { type: ['string', 'null'], description: 'Manufacturer, only if stated or printed.' },
    model: { type: ['string', 'null'], description: 'Model name or number, only if stated or printed.' },
    serialNumber: {
      type: ['string', 'null'],
      description: 'Serial number copied exactly as written. null unless every character is certain.',
    },
    assetTag: {
      type: ['string', 'null'],
      description: 'Internal inventory or asset tag copied exactly as written. null unless every character is certain.',
    },
    suggestedStatus: {
      type: ['string', 'null'],
      enum: [...SUGGESTED_STATUSES, null],
      description: 'Only if the content states or clearly implies the condition, otherwise null.',
    },
    issueSummary: {
      type: 'string',
      description: 'One sentence in French describing the reported problem, or an empty string if there is none.',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Overall reliability of the extracted fields, from 0 to 1.',
    },
  },
  required: [
    'equipmentType',
    'brand',
    'model',
    'serialNumber',
    'assetTag',
    'suggestedStatus',
    'issueSummary',
    'confidence',
  ],
} as const;

const PLACEHOLDER =
  /^(null|none|n\/?a|nc|unknown|inconnu(e)?|non (lisible|visible|disponible|renseign[ée]e?|indiqu[ée]e?)|illisible|[-–—?]+)$/i;

/** Trim, and turn empty strings and "unknown"-style placeholders into null. */
export function cleanNullable(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '' || PLACEHOLDER.test(trimmed)) return null;
  return trimmed;
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').toLowerCase();
}

export type DescriptionSource = { kind: 'text'; text: string } | { kind: 'image' };

/**
 * Final safety net applied to every model answer: placeholder strings become
 * null, confidence is clamped, and for text input an identifier that does not
 * appear in the text is dropped (the model can only have invented it).
 */
export function normalizeDescription(
  raw: z.infer<typeof modelOutputSchema>,
  source: DescriptionSource,
): AssetDescription {
  const haystack = source.kind === 'text' ? collapseSpaces(source.text) : null;
  const keepIfPresent = (value: string | null): string | null => {
    const cleaned = cleanNullable(value);
    if (cleaned === null || haystack === null) return cleaned;
    return haystack.includes(collapseSpaces(cleaned)) ? cleaned : null;
  };

  return assetDescriptionSchema.parse({
    equipmentType: raw.equipmentType,
    brand: cleanNullable(raw.brand),
    model: cleanNullable(raw.model),
    serialNumber: keepIfPresent(raw.serialNumber),
    assetTag: keepIfPresent(raw.assetTag),
    suggestedStatus: raw.suggestedStatus,
    issueSummary: raw.issueSummary.replace(/\s+/g, ' ').trim(),
    confidence: Math.min(1, Math.max(0, Number.isFinite(raw.confidence) ? raw.confidence : 0)),
  });
}
