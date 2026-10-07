import type { Asset, AssetStatus } from './asset';
import type { AssetEquipmentType } from './equipment';
import { ASSET_STATUSES } from './asset';
import { normalizeText } from './text';

export interface SiteCount {
  site: string;
  count: number;
}

export function countBySite(assets: readonly Asset[]): SiteCount[] {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    counts.set(asset.site, (counts.get(asset.site) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([site, count]) => ({ site, count }))
    .sort((a, b) => a.site.localeCompare(b.site, 'fr'));
}

export function countByStatus(assets: readonly Asset[]): Record<AssetStatus, number> {
  const counts = Object.fromEntries(ASSET_STATUSES.map((status) => [status, 0])) as Record<
    AssetStatus,
    number
  >;
  for (const asset of assets) {
    counts[asset.status] += 1;
  }
  return counts;
}

export interface AssetFilters {
  query: string;
  /** Empty string means all sites. */
  site: string;
  /** Empty string means all statuses. */
  status: AssetStatus | '';
  /** Empty string means all equipment types. */
  type: AssetEquipmentType | '';
}

export function filterAssets(assets: readonly Asset[], filters: AssetFilters): Asset[] {
  const query = normalizeText(filters.query);
  return assets.filter((asset) => {
    if (filters.site && asset.site !== filters.site) return false;
    if (filters.status && asset.status !== filters.status) return false;
    if (filters.type && asset.equipmentType !== filters.type) return false;
    if (!query) return true;
    const haystack = normalizeText(
      [
        asset.assetTag,
        asset.serialNumber,
        asset.assignedTo,
        asset.site,
        asset.notes,
        asset.brand,
        asset.modelLabel,
      ].join(' '),
    );
    return haystack.includes(query);
  });
}
