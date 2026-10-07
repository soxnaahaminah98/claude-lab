import { describe, expect, it } from 'vitest';
import {
  applyCatalogueModel,
  createEmptyAssetDraft,
  findDuplicates,
  isValidIsoDate,
  isWarrantyExpired,
  missingAssetFields,
  parseAssetDraft,
  toDuplicateDraft,
  todayIsoDate,
  warrantyEndDate,
} from './asset';
import type { Asset, AssetDraft } from './asset';
import { getCatalogueModel } from './catalogue-data';

const DRAFT: AssetDraft = {
  modelId: 'laptop-office-14',
  equipmentType: 'laptop',
  brand: 'Dell',
  modelLabel: 'Portable bureautique 14 pouces',
  site: 'Site test',
  assetTag: 'TEST-0001',
  serialNumber: 'SN-TEST-1',
  status: 'in-service',
  assignedTo: 'Poste test',
  purchaseDate: '2024-01-15',
  notes: '',
};

const EXISTING: Asset = {
  modelId: DRAFT.modelId,
  equipmentType: 'laptop',
  brand: DRAFT.brand,
  modelLabel: DRAFT.modelLabel,
  site: 'Site A',
  assetTag: 'TEST-0001',
  serialNumber: 'SN-TEST-1',
  status: 'in-service',
  assignedTo: '',
  purchaseDate: '2024-01-15',
  notes: '',
  id: 'a1',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

const TODAY = '2025-06-01';

describe('parseAssetDraft', () => {
  it('returns a trimmed input for a complete draft', () => {
    const result = parseAssetDraft({ ...DRAFT, site: '  Site test ', brand: ' Dell ' }, TODAY);
    expect(result).toMatchObject({ ok: true, input: { site: 'Site test', brand: 'Dell', equipmentType: 'laptop' } });
  });

  it('requires type, site, tag and status', () => {
    const result = parseAssetDraft({ ...createEmptyAssetDraft(), status: '' }, TODAY);
    expect(result).toEqual({
      ok: false,
      errors: { equipmentType: 'required', site: 'required', assetTag: 'required', status: 'required' },
    });
  });

  it('does not require brand, model, serial number or catalogue model', () => {
    const result = parseAssetDraft({ ...DRAFT, modelId: '', brand: '', modelLabel: '', serialNumber: '' }, TODAY);
    expect(result.ok).toBe(true);
  });

  it('rejects blank site and tag', () => {
    const result = parseAssetDraft({ ...DRAFT, site: '  ', assetTag: ' ' }, TODAY);
    expect(result).toMatchObject({ ok: false, errors: { site: 'required', assetTag: 'required' } });
  });

  it('rejects invalid and future purchase dates but accepts an empty one', () => {
    expect(parseAssetDraft({ ...DRAFT, purchaseDate: '2024-02-31' }, TODAY)).toMatchObject({
      errors: { purchaseDate: 'invalid-date' },
    });
    expect(parseAssetDraft({ ...DRAFT, purchaseDate: '2026-01-01' }, TODAY)).toMatchObject({
      errors: { purchaseDate: 'future-date' },
    });
    expect(parseAssetDraft({ ...DRAFT, purchaseDate: '' }, TODAY).ok).toBe(true);
  });
});

describe('findDuplicates', () => {
  it('warns about an existing tag and serial number, ignoring case and spaces', () => {
    const warnings = findDuplicates({ assetTag: ' test-0001 ', serialNumber: 'sn-test-1' }, [EXISTING]);
    expect(warnings.map((warning) => warning.field)).toEqual(['assetTag', 'serialNumber']);
    expect(warnings[0]?.existing.id).toBe('a1');
  });

  it('finds nothing for new values', () => {
    expect(findDuplicates({ assetTag: 'TEST-0002', serialNumber: 'SN-TEST-2' }, [EXISTING])).toEqual([]);
  });

  it('ignores the asset being edited', () => {
    expect(findDuplicates(EXISTING, [EXISTING], 'a1')).toEqual([]);
  });

  it('never matches blank values', () => {
    const blank: Asset = { ...EXISTING, serialNumber: '' };
    expect(findDuplicates({ assetTag: 'TEST-0009', serialNumber: '' }, [blank])).toEqual([]);
    expect(findDuplicates({ assetTag: 'TEST-0009', serialNumber: '   ' }, [blank])).toEqual([]);
  });
});

describe('applyCatalogueModel', () => {
  it('copies type, brand and model label from the catalogue model', () => {
    const model = getCatalogueModel('network-switch-24-poe');
    const draft = applyCatalogueModel(createEmptyAssetDraft(), model);
    expect(draft).toMatchObject({
      modelId: 'network-switch-24-poe',
      equipmentType: 'network-device',
      brand: 'Cisco',
      modelLabel: 'Commutateur géré 24 ports PoE',
    });
  });

  it('only clears the link when no model is given', () => {
    const draft = applyCatalogueModel(DRAFT, undefined);
    expect(draft).toEqual({ ...DRAFT, modelId: '' });
  });
});

describe('toDuplicateDraft', () => {
  it('clears the fields that identify one unit and keeps the rest', () => {
    const copy = toDuplicateDraft(EXISTING);
    expect(copy.assetTag).toBe('');
    expect(copy.serialNumber).toBe('');
    expect(copy.assignedTo).toBe('');
    expect(copy).toMatchObject({
      modelId: EXISTING.modelId,
      equipmentType: 'laptop',
      brand: EXISTING.brand,
      site: EXISTING.site,
      status: EXISTING.status,
      purchaseDate: EXISTING.purchaseDate,
    });
  });
});

describe('dates and warranty', () => {
  it('validates ISO dates', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2023-02-29')).toBe(false);
    expect(isValidIsoDate('15/01/2024')).toBe(false);
  });

  it('formats a local date', () => {
    expect(todayIsoDate(new Date(2025, 2, 9))).toBe('2025-03-09');
  });

  it('adds warranty months', () => {
    expect(warrantyEndDate('2024-01-15', 36)).toBe('2027-01-15');
    expect(warrantyEndDate('2024-11-20', 3)).toBe('2025-02-20');
  });

  it('clamps to the end of shorter months', () => {
    expect(warrantyEndDate('2024-01-31', 1)).toBe('2024-02-29');
    expect(warrantyEndDate('2023-08-31', 12)).toBe('2024-08-31');
  });

  it('returns null for an empty or invalid purchase date', () => {
    expect(warrantyEndDate('', 12)).toBeNull();
    expect(warrantyEndDate('nope', 12)).toBeNull();
  });

  it('detects an expired warranty', () => {
    expect(isWarrantyExpired('2025-05-31', '2025-06-01')).toBe(true);
    expect(isWarrantyExpired('2025-06-01', '2025-06-01')).toBe(false);
  });
});

describe('missingAssetFields', () => {
  it('is empty for a complete record', () => {
    expect(missingAssetFields(EXISTING)).toEqual([]);
  });

  it('reports a missing serial number, ignoring blanks', () => {
    expect(missingAssetFields({ ...EXISTING, serialNumber: '   ' })).toEqual(['serialNumber']);
  });

  it('reports a missing model only when both brand and model label are empty', () => {
    expect(missingAssetFields({ ...EXISTING, brand: '' })).toEqual([]);
    expect(missingAssetFields({ ...EXISTING, modelLabel: '' })).toEqual([]);
    expect(missingAssetFields({ ...EXISTING, brand: ' ', modelLabel: '' })).toEqual(['model']);
  });

  it('reports everything that is missing', () => {
    expect(missingAssetFields({ serialNumber: '', brand: '', modelLabel: '' })).toEqual(['serialNumber', 'model']);
  });
});
