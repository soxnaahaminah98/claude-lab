import type { Asset, AssetInput } from '../domain/asset';
import { isAssetStatus } from '../domain/asset';
import { getCatalogueModel } from '../domain/catalogue-data';
import { isAssetEquipmentType } from '../domain/equipment';

/**
 * Persistence seam for assets. Callers only depend on this interface, so the
 * localStorage implementation can be replaced by Firestore without touching
 * the UI. All methods are async for that reason.
 */
export interface AssetRepository {
  list(): Promise<Asset[]>;
  create(input: AssetInput): Promise<Asset>;
  update(id: string, input: AssetInput): Promise<Asset>;
  remove(id: string): Promise<void>;
}

export const ASSETS_STORAGE_KEY = 'itparc.assets';
/** v2 added `equipmentType`, `brand` and `modelLabel` to every asset. */
const STORAGE_VERSION = 2;

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Fields shared by the v1 and v2 stored shapes. */
function hasBaseFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === 'string' &&
    typeof value.modelId === 'string' &&
    typeof value.site === 'string' &&
    typeof value.assetTag === 'string' &&
    typeof value.serialNumber === 'string' &&
    isAssetStatus(value.status) &&
    typeof value.assignedTo === 'string' &&
    typeof value.purchaseDate === 'string' &&
    typeof value.notes === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isAsset(value: unknown): value is Asset {
  return (
    isRecord(value) &&
    hasBaseFields(value) &&
    isAssetEquipmentType(value.equipmentType) &&
    typeof value.brand === 'string' &&
    typeof value.modelLabel === 'string'
  );
}

/** A v1 asset had no type, brand or model label: they came from the catalogue model. */
function migrateV1(value: unknown): Asset | null {
  if (!isRecord(value) || !hasBaseFields(value)) return null;
  const model = getCatalogueModel(String(value.modelId));
  const migrated: unknown = {
    ...value,
    equipmentType: model?.type ?? 'other',
    brand: model?.brand ?? '',
    modelLabel: model?.modelLabel ?? '',
  };
  return isAsset(migrated) ? migrated : null;
}

function readAll(storage: KeyValueStorage): Asset[] {
  try {
    const raw = storage.getItem(ASSETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.assets)) return [];
    const items: unknown[] = parsed.assets;
    if (parsed.version === STORAGE_VERSION) return items.filter(isAsset);
    if (parsed.version === 1) {
      return items.map(migrateV1).filter((asset): asset is Asset => asset !== null);
    }
    return [];
  } catch {
    // Unreadable storage or corrupt JSON: behave as an empty inventory.
    return [];
  }
}

function writeAll(storage: KeyValueStorage, assets: readonly Asset[]): void {
  storage.setItem(ASSETS_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, assets }));
}

export function createLocalStorageAssetRepository(storage: KeyValueStorage): AssetRepository {
  return {
    async list() {
      return readAll(storage);
    },

    async create(input) {
      const now = new Date().toISOString();
      const asset: Asset = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      writeAll(storage, [...readAll(storage), asset]);
      return asset;
    },

    async update(id, input) {
      const assets = readAll(storage);
      const current = assets.find((asset) => asset.id === id);
      if (!current) throw new Error(`Asset not found: ${id}`);
      const updated: Asset = {
        ...input,
        id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      writeAll(
        storage,
        assets.map((asset) => (asset.id === id ? updated : asset)),
      );
      return updated;
    },

    async remove(id) {
      writeAll(
        storage,
        readAll(storage).filter((asset) => asset.id !== id),
      );
    },
  };
}

/** Default repository, bound to the browser's localStorage on first use. */
export const assetRepository: AssetRepository = createLocalStorageAssetRepository({
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
});
