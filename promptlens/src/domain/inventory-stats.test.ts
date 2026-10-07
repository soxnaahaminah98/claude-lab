import { describe, expect, it } from 'vitest';
import type { Asset } from './asset';
import { countBySite, countByStatus, filterAssets } from './inventory-stats';

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    id: 'id',
    modelId: 'laptop-office-14',
    equipmentType: 'laptop',
    brand: 'Dell',
    modelLabel: 'Portable bureautique 14 pouces',
    site: 'Site A',
    assetTag: 'TEST-0001',
    serialNumber: '',
    status: 'in-service',
    assignedTo: '',
    purchaseDate: '',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const ASSETS: Asset[] = [
  makeAsset({ id: '1', site: 'Site B', assetTag: 'TEST-0001', status: 'in-service' }),
  makeAsset({ id: '2', site: 'Site A', assetTag: 'TEST-0002', status: 'broken', serialNumber: 'SN-XYZ' }),
  makeAsset({ id: '3', site: 'Site A', assetTag: 'TEST-0003', status: 'in-service', assignedTo: 'Accueil' }),
];

describe('countBySite', () => {
  it('counts and sorts by site name', () => {
    expect(countBySite(ASSETS)).toEqual([
      { site: 'Site A', count: 2 },
      { site: 'Site B', count: 1 },
    ]);
  });

  it('returns an empty list for no assets', () => {
    expect(countBySite([])).toEqual([]);
  });
});

describe('countByStatus', () => {
  it('includes every status, with zeros', () => {
    expect(countByStatus(ASSETS)).toEqual({
      'in-service': 2,
      'in-stock': 0,
      broken: 1,
      'in-repair': 0,
      retired: 0,
    });
  });
});

describe('filterAssets', () => {
  it('returns everything without filters', () => {
    expect(filterAssets(ASSETS, { query: '', site: '', status: '', type: '' })).toHaveLength(3);
  });

  it('filters by site and status', () => {
    expect(filterAssets(ASSETS, { query: '', site: 'Site A', status: '', type: '' })).toHaveLength(2);
    expect(filterAssets(ASSETS, { query: '', site: 'Site A', status: 'broken', type: '' })).toHaveLength(1);
  });

  it('filters by equipment type', () => {
    const withPrinter: Asset[] = [...ASSETS, makeAsset({ id: '4', assetTag: 'TEST-0004', equipmentType: 'printer' })];
    const result = filterAssets(withPrinter, { query: '', site: '', status: '', type: 'printer' });
    expect(result.map((asset) => asset.id)).toEqual(['4']);
    expect(filterAssets(withPrinter, { query: '', site: '', status: '', type: 'smartphone' })).toEqual([]);
  });

  it('searches tag, serial, assignee and model, ignoring case and accents', () => {
    expect(filterAssets(ASSETS, { query: 'test-0003', site: '', status: '', type: '' })).toHaveLength(1);
    expect(filterAssets(ASSETS, { query: 'sn-xyz', site: '', status: '', type: '' })).toHaveLength(1);
    expect(filterAssets(ASSETS, { query: 'ACCUEIL', site: '', status: '', type: '' })).toHaveLength(1);
    expect(filterAssets(ASSETS, { query: 'bureautique', site: '', status: '', type: '' })).toHaveLength(3);
  });
});
