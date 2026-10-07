import { describe, expect, it } from 'vitest';
import {
  ASSET_DESCRIPTION_JSON_SCHEMA,
  EQUIPMENT_TYPES,
  SUGGESTED_STATUSES,
  assetDescriptionSchema,
  cleanNullable,
  normalizeDescription,
  parseModelOutput,
} from './asset-description';

const RAW = {
  equipmentType: 'laptop',
  brand: 'Exemple Tech',
  model: 'DEMO-14',
  serialNumber: null,
  assetTag: 'TEST-0001',
  suggestedStatus: 'en_panne',
  issueSummary: 'L’écran reste noir au démarrage.',
  confidence: 0.9,
} as const;

function parse(overrides: Record<string, unknown> = {}) {
  const parsed = parseModelOutput({ ...RAW, ...overrides });
  if (!parsed) throw new Error('fixture should parse');
  return parsed;
}

describe('JSON schema sent to Gemini', () => {
  it('lists the same keys as the zod schema, all required', () => {
    const zodKeys = Object.keys(assetDescriptionSchema.shape).sort();
    expect(Object.keys(ASSET_DESCRIPTION_JSON_SCHEMA.properties).sort()).toEqual(zodKeys);
    expect([...ASSET_DESCRIPTION_JSON_SCHEMA.required].sort()).toEqual(zodKeys);
  });

  it('uses the same enum values, plus null for the nullable ones', () => {
    const { equipmentType, suggestedStatus } = ASSET_DESCRIPTION_JSON_SCHEMA.properties;
    expect(equipmentType.enum).toEqual([...EQUIPMENT_TYPES, null]);
    expect(suggestedStatus.enum).toEqual([...SUGGESTED_STATUSES, null]);
  });
});

describe('parseModelOutput', () => {
  it('accepts a complete answer', () => {
    expect(parseModelOutput(RAW)).not.toBeNull();
  });

  it('rejects unknown enum values, missing keys and extra keys', () => {
    expect(parseModelOutput({ ...RAW, equipmentType: 'toaster' })).toBeNull();
    expect(parseModelOutput({ ...RAW, suggestedStatus: 'en_vente' })).toBeNull();
    const { confidence: _confidence, ...withoutConfidence } = RAW;
    expect(parseModelOutput(withoutConfidence)).toBeNull();
    expect(parseModelOutput({ ...RAW, extra: 1 })).toBeNull();
    expect(parseModelOutput('nope')).toBeNull();
  });
});

describe('cleanNullable', () => {
  it('turns blanks and placeholders into null and trims the rest', () => {
    expect(cleanNullable('')).toBeNull();
    expect(cleanNullable('   ')).toBeNull();
    expect(cleanNullable('N/A')).toBeNull();
    expect(cleanNullable('inconnu')).toBeNull();
    expect(cleanNullable('Non lisible')).toBeNull();
    expect(cleanNullable('unknown')).toBeNull();
    expect(cleanNullable('—')).toBeNull();
    expect(cleanNullable(null)).toBeNull();
    expect(cleanNullable('  SN-TEST-1 ')).toBe('SN-TEST-1');
  });
});

describe('normalizeDescription', () => {
  it('clamps confidence into [0, 1]', () => {
    expect(normalizeDescription(parse({ confidence: 1.4 }), { kind: 'image' }).confidence).toBe(1);
    expect(normalizeDescription(parse({ confidence: -2 }), { kind: 'image' }).confidence).toBe(0);
  });

  it('nulls placeholder identifiers for images', () => {
    const result = normalizeDescription(parse({ serialNumber: 'N/A', assetTag: ' ' }), { kind: 'image' });
    expect(result.serialNumber).toBeNull();
    expect(result.assetTag).toBeNull();
  });

  it('keeps an identifier that appears in the text, ignoring case and spacing', () => {
    const source = { kind: 'text', text: 'Portable DEMO-14, étiquette  test-0001, écran noir' } as const;
    expect(normalizeDescription(parse(), source).assetTag).toBe('TEST-0001');
  });

  it('drops a serial number or tag that the text does not contain', () => {
    const source = { kind: 'text', text: 'Portable DEMO-14, écran noir' } as const;
    const result = normalizeDescription(parse({ serialNumber: 'SN-INVENTED-9' }), source);
    expect(result.serialNumber).toBeNull();
    expect(result.assetTag).toBeNull();
  });

  it('keeps brand, model and status, and flattens line breaks in the summary', () => {
    const result = normalizeDescription(parse({ issueSummary: ' Écran\nnoir. ' }), { kind: 'image' });
    expect(result).toMatchObject({ brand: 'Exemple Tech', model: 'DEMO-14', suggestedStatus: 'en_panne' });
    expect(result.issueSummary).toBe('Écran noir.');
  });

  it('produces output that satisfies the public schema', () => {
    expect(() => assetDescriptionSchema.parse(normalizeDescription(parse(), { kind: 'image' }))).not.toThrow();
  });
});
