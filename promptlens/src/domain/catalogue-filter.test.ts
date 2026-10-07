import { describe, expect, it } from 'vitest';
import { CATALOGUE_MODELS } from './catalogue-data';
import { filterCatalogue } from './catalogue-filter';

describe('filterCatalogue', () => {
  it('returns everything without filters', () => {
    expect(filterCatalogue(CATALOGUE_MODELS, { query: '', type: '' })).toHaveLength(20);
  });

  it('filters by type', () => {
    const result = filterCatalogue(CATALOGUE_MODELS, { query: '', type: 'receipt-printer' });
    expect(result).toHaveLength(3);
    expect(result.every((model) => model.type === 'receipt-printer')).toBe(true);
  });

  it('searches brand and label, ignoring case and accents', () => {
    expect(filterCatalogue(CATALOGUE_MODELS, { query: 'CISCO', type: '' })).toHaveLength(1);
    expect(filterCatalogue(CATALOGUE_MODELS, { query: 'ultralegér', type: '' })).toHaveLength(1);
  });

  it('combines query and type', () => {
    expect(filterCatalogue(CATALOGUE_MODELS, { query: 'cisco', type: 'laptop' })).toHaveLength(0);
  });
});
