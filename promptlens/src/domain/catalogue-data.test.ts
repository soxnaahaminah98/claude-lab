import { describe, expect, it } from 'vitest';
import { CATALOGUE_MODELS, getCatalogueModel } from './catalogue-data';
import { EQUIPMENT_TYPES } from './equipment';

describe('CATALOGUE_MODELS', () => {
  it('contains exactly 20 models', () => {
    expect(CATALOGUE_MODELS).toHaveLength(20);
  });

  it('has unique ids', () => {
    const ids = CATALOGUE_MODELS.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every equipment type', () => {
    for (const type of EQUIPMENT_TYPES) {
      expect(CATALOGUE_MODELS.some((model) => model.type === type)).toBe(true);
    }
  });

  it('has complete entries with a positive warranty', () => {
    for (const model of CATALOGUE_MODELS) {
      expect(model.brand).not.toBe('');
      expect(model.modelLabel).not.toBe('');
      expect(model.typicalUse).not.toBe('');
      expect(model.warrantyMonths).toBeGreaterThan(0);
    }
  });

  it('looks models up by id', () => {
    expect(getCatalogueModel('laptop-office-14')?.type).toBe('laptop');
    expect(getCatalogueModel('missing')).toBeUndefined();
  });
});
