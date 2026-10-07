import { FR } from '../../copy/fr';
import { ASSET_STATUSES, isAssetStatus } from '../../domain/asset';
import type { AssetStatus } from '../../domain/asset';
import { ASSET_EQUIPMENT_TYPES, isAssetEquipmentType } from '../../domain/equipment';
import type { AssetEquipmentType } from '../../domain/equipment';

interface InventoryFiltersProps {
  query: string;
  site: string;
  status: AssetStatus | '';
  type: AssetEquipmentType | '';
  sites: readonly string[];
  canReset: boolean;
  onQueryChange: (query: string) => void;
  onSiteChange: (site: string) => void;
  onStatusChange: (status: AssetStatus | '') => void;
  onTypeChange: (type: AssetEquipmentType | '') => void;
  onReset: () => void;
}

/** Search plus site, status and type filters. The summary chips above drive the same state. */
export function InventoryFilters({
  query,
  site,
  status,
  type,
  sites,
  canReset,
  onQueryChange,
  onSiteChange,
  onStatusChange,
  onTypeChange,
  onReset,
}: InventoryFiltersProps) {
  return (
    <div className="filter-bar" role="search" aria-label={FR.inventory.filtersLabel}>
      <div className="field filter-bar__search">
        <label htmlFor="inventory-search">{FR.inventory.searchLabel}</label>
        <input
          id="inventory-search"
          type="search"
          value={query}
          placeholder={FR.inventory.searchPlaceholder}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="inventory-site">{FR.inventory.siteFilter}</label>
        <select id="inventory-site" value={site} onChange={(event) => onSiteChange(event.target.value)}>
          <option value="">{FR.inventory.allSites}</option>
          {sites.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="inventory-status">{FR.inventory.statusFilter}</label>
        <select
          id="inventory-status"
          value={status}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '' || isAssetStatus(value)) onStatusChange(value);
          }}
        >
          <option value="">{FR.inventory.allStatuses}</option>
          {ASSET_STATUSES.map((value) => (
            <option key={value} value={value}>
              {FR.statuses[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="inventory-type">{FR.inventory.typeFilter}</label>
        <select
          id="inventory-type"
          value={type}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '' || isAssetEquipmentType(value)) onTypeChange(value);
          }}
        >
          <option value="">{FR.inventory.allTypes}</option>
          {ASSET_EQUIPMENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {FR.assetEquipmentTypes[value]}
            </option>
          ))}
        </select>
      </div>

      {canReset && (
        <button type="button" className="btn filter-bar__reset" onClick={onReset}>
          {FR.inventory.resetFilters}
        </button>
      )}
    </div>
  );
}
