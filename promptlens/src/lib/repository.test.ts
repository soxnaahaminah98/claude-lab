import { beforeEach, describe, expect, it } from 'vitest';
import type { AssetInput } from '../domain/asset';
import { ASSETS_STORAGE_KEY, createLocalStorageAssetRepository } from './repository';

class MemoryStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const INPUT: AssetInput = {
  modelId: 'laptop-office-14',
  equipmentType: 'laptop',
  brand: 'Dell',
  modelLabel: 'Portable bureautique 14 pouces',
  site: 'Site test',
  assetTag: 'TEST-0001',
  serialNumber: 'SN-TEST-1',
  status: 'in-stock',
  assignedTo: '',
  purchaseDate: '2024-01-15',
  notes: 'note',
};

const V1_ASSET = {
  id: 'old-1',
  modelId: 'printer-laser-mono',
  site: 'Site test',
  assetTag: 'TEST-0100',
  serialNumber: '',
  status: 'in-service',
  assignedTo: '',
  purchaseDate: '',
  notes: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
});

describe('localStorage asset repository', () => {
  it('starts empty', async () => {
    expect(await createLocalStorageAssetRepository(storage).list()).toEqual([]);
  });

  it('creates an asset with an id and timestamps', async () => {
    const created = await createLocalStorageAssetRepository(storage).create(INPUT);
    expect(created.id).not.toBe('');
    expect(created).toMatchObject({ equipmentType: 'laptop', brand: 'Dell', site: 'Site test' });
    expect(created.createdAt).toBe(created.updatedAt);
  });

  it('keeps assets across repository instances (page refresh)', async () => {
    await createLocalStorageAssetRepository(storage).create(INPUT);
    const afterRefresh = await createLocalStorageAssetRepository(storage).list();
    expect(afterRefresh).toHaveLength(1);
    expect(afterRefresh[0]?.assetTag).toBe('TEST-0001');
  });

  it('stores custom assets that have no catalogue model', async () => {
    const repository = createLocalStorageAssetRepository(storage);
    await repository.create({ ...INPUT, modelId: '', equipmentType: 'other', brand: '', modelLabel: '' });
    expect(await repository.list()).toHaveLength(1);
  });

  it('updates an asset and keeps its creation date', async () => {
    const repository = createLocalStorageAssetRepository(storage);
    const created = await repository.create(INPUT);
    const updated = await repository.update(created.id, { ...INPUT, status: 'broken' });
    expect(updated.status).toBe('broken');
    expect(updated.createdAt).toBe(created.createdAt);
    expect(await repository.list()).toHaveLength(1);
  });

  it('rejects updating an unknown asset', async () => {
    await expect(createLocalStorageAssetRepository(storage).update('missing', INPUT)).rejects.toThrow();
  });

  it('removes an asset', async () => {
    const repository = createLocalStorageAssetRepository(storage);
    const created = await repository.create(INPUT);
    await repository.remove(created.id);
    expect(await repository.list()).toEqual([]);
  });

  it('treats corrupt JSON as an empty inventory', async () => {
    storage.setItem(ASSETS_STORAGE_KEY, '{not json');
    expect(await createLocalStorageAssetRepository(storage).list()).toEqual([]);
  });

  it('skips malformed entries and ignores unknown versions', async () => {
    const repository = createLocalStorageAssetRepository(storage);
    const created = await repository.create(INPUT);
    storage.setItem(
      ASSETS_STORAGE_KEY,
      JSON.stringify({ version: 2, assets: [created, { id: 'bad' }, 42] }),
    );
    expect(await repository.list()).toHaveLength(1);

    storage.setItem(ASSETS_STORAGE_KEY, JSON.stringify({ version: 99, assets: [created] }));
    expect(await repository.list()).toEqual([]);
  });
});

describe('migration from storage version 1', () => {
  it('fills type, brand and model label from the catalogue model', async () => {
    storage.setItem(ASSETS_STORAGE_KEY, JSON.stringify({ version: 1, assets: [V1_ASSET] }));
    const [asset] = await createLocalStorageAssetRepository(storage).list();
    expect(asset).toMatchObject({
      id: 'old-1',
      modelId: 'printer-laser-mono',
      equipmentType: 'printer',
      brand: 'Brother',
      modelLabel: 'Laser monochrome réseau',
      assetTag: 'TEST-0100',
    });
  });

  it('keeps assets whose catalogue model is unknown, as type "other"', async () => {
    storage.setItem(
      ASSETS_STORAGE_KEY,
      JSON.stringify({ version: 1, assets: [{ ...V1_ASSET, modelId: 'removed-model' }] }),
    );
    const [asset] = await createLocalStorageAssetRepository(storage).list();
    expect(asset).toMatchObject({ equipmentType: 'other', brand: '', modelLabel: '' });
  });

  it('skips malformed v1 entries', async () => {
    storage.setItem(ASSETS_STORAGE_KEY, JSON.stringify({ version: 1, assets: [V1_ASSET, { id: 'bad' }] }));
    expect(await createLocalStorageAssetRepository(storage).list()).toHaveLength(1);
  });

  it('writes version 2 on the next change and keeps the migrated assets', async () => {
    storage.setItem(ASSETS_STORAGE_KEY, JSON.stringify({ version: 1, assets: [V1_ASSET] }));
    const repository = createLocalStorageAssetRepository(storage);
    await repository.create(INPUT);
    const stored: unknown = JSON.parse(storage.getItem(ASSETS_STORAGE_KEY) ?? '{}');
    expect(stored).toMatchObject({ version: 2 });
    expect(await repository.list()).toHaveLength(2);
  });
});
