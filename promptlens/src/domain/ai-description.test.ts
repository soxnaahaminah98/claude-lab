import { describe, expect, it } from 'vitest';
import { draftFromAiDescription, isUnreadable, parseAiDescription } from './ai-description';
import type { AiAssetDescription } from './ai-description';

const FULL: AiAssetDescription = {
  equipmentType: 'receipt_printer',
  brand: 'Exemple Tech',
  model: 'DEMO-80',
  serialNumber: 'SN-TEST-0000-DEMO',
  assetTag: 'TEST-0001',
  suggestedStatus: 'en_reparation',
  issueSummary: 'Le papier se bloque.',
  confidence: 0.9,
};

const EMPTY: AiAssetDescription = {
  equipmentType: null,
  brand: null,
  model: null,
  serialNumber: null,
  assetTag: null,
  suggestedStatus: null,
  issueSummary: '',
  confidence: 0.2,
};

describe('parseAiDescription', () => {
  it('accepts a complete answer and one made of nulls', () => {
    expect(parseAiDescription(FULL)).toEqual(FULL);
    expect(parseAiDescription(EMPTY)).toEqual(EMPTY);
  });

  it('clamps confidence into [0, 1]', () => {
    expect(parseAiDescription({ ...FULL, confidence: 4 })?.confidence).toBe(1);
    expect(parseAiDescription({ ...FULL, confidence: -1 })?.confidence).toBe(0);
  });

  it('rejects unexpected shapes', () => {
    expect(parseAiDescription(null)).toBeNull();
    expect(parseAiDescription('text')).toBeNull();
    expect(parseAiDescription({ ...FULL, equipmentType: 'toaster' })).toBeNull();
    expect(parseAiDescription({ ...FULL, suggestedStatus: 'en_vente' })).toBeNull();
    expect(parseAiDescription({ ...FULL, brand: 5 })).toBeNull();
    expect(parseAiDescription({ ...FULL, issueSummary: null })).toBeNull();
    expect(parseAiDescription({ ...FULL, confidence: '0.9' })).toBeNull();
    expect(parseAiDescription({ ...FULL, serialNumber: undefined })).toBeNull();
  });
});

describe('draftFromAiDescription', () => {
  it('maps the backend spelling to the domain values', () => {
    const { draft, toComplete } = draftFromAiDescription(FULL);
    expect(draft).toMatchObject({
      modelId: '',
      equipmentType: 'receipt-printer',
      brand: 'Exemple Tech',
      modelLabel: 'DEMO-80',
      serialNumber: 'SN-TEST-0000-DEMO',
      assetTag: 'TEST-0001',
      status: 'in-repair',
      notes: 'Le papier se bloque.',
    });
    expect(toComplete).toEqual([]);
  });

  it('maps every type and status', () => {
    const types = {
      laptop: 'laptop',
      desktop: 'desktop',
      printer: 'printer',
      receipt_printer: 'receipt-printer',
      smartphone: 'smartphone',
      network_device: 'network-device',
      other: 'other',
    } as const;
    for (const [ai, domain] of Object.entries(types)) {
      const input = { ...FULL, equipmentType: ai } as AiAssetDescription;
      expect(draftFromAiDescription(input).draft.equipmentType).toBe(domain);
    }
    const statuses = {
      en_service: 'in-service',
      en_stock: 'in-stock',
      en_panne: 'broken',
      en_reparation: 'in-repair',
      retire: 'retired',
    } as const;
    for (const [ai, domain] of Object.entries(statuses)) {
      const input = { ...FULL, suggestedStatus: ai } as AiAssetDescription;
      expect(draftFromAiDescription(input).draft.status).toBe(domain);
    }
  });

  it('never fills a null field: it stays empty and is listed as to complete', () => {
    const { draft, toComplete } = draftFromAiDescription(EMPTY);
    expect(draft).toMatchObject({
      equipmentType: '',
      brand: '',
      modelLabel: '',
      serialNumber: '',
      assetTag: '',
      status: '',
      notes: '',
    });
    expect(toComplete).toEqual(['equipmentType', 'brand', 'modelLabel', 'serialNumber', 'assetTag', 'status']);
  });

  it('treats blank strings like null', () => {
    const { draft, toComplete } = draftFromAiDescription({ ...FULL, serialNumber: '  ' });
    expect(draft.serialNumber).toBe('');
    expect(toComplete).toEqual(['serialNumber']);
  });

  it('does not mark an empty issue summary as to complete', () => {
    const { toComplete } = draftFromAiDescription({ ...FULL, issueSummary: '' });
    expect(toComplete).toEqual([]);
  });

  it('keeps the site given by the caller', () => {
    expect(draftFromAiDescription(FULL, 'Site test').draft.site).toBe('Site test');
  });
});

describe('isUnreadable', () => {
  it('is true when brand, model, serial and tag are all null or blank', () => {
    expect(isUnreadable(EMPTY)).toBe(true);
    expect(isUnreadable({ ...EMPTY, brand: '  ', equipmentType: 'laptop' })).toBe(true);
  });

  it('is false as soon as one identifying field was read', () => {
    expect(isUnreadable({ ...EMPTY, brand: 'Exemple Tech' })).toBe(false);
    expect(isUnreadable({ ...EMPTY, assetTag: 'TEST-0001' })).toBe(false);
    expect(isUnreadable(FULL)).toBe(false);
  });
});
