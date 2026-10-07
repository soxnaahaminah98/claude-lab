import { FR } from '../../copy/fr';
import { ASSET_STATUSES } from '../../domain/asset';
import type { Asset, AssetStatus } from '../../domain/asset';
import { countBySite, countByStatus } from '../../domain/inventory-stats';

interface InventoryCountersProps {
  assets: readonly Asset[];
  site: string;
  status: AssetStatus | '';
  onSiteChange: (site: string) => void;
  onStatusChange: (status: AssetStatus | '') => void;
}

/** Summary row: the total, one tile per status and the per-site breakdown. Tiles and chips toggle the filters. */
export function InventoryCounters({ assets, site, status, onSiteChange, onStatusChange }: InventoryCountersProps) {
  const sites = countBySite(assets);
  const statuses = countByStatus(assets);

  return (
    <section className="summary" aria-label={FR.inventory.summaryTitle}>
      <div className="summary__tiles" role="group" aria-label={FR.inventory.byStatus}>
        <p className="tile tile--total">
          <span className="tile__label">{FR.inventory.total}</span>
          <span className="tile__value">{assets.length}</span>
        </p>
        {ASSET_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            className={`tile tile--button status--${value}`}
            aria-pressed={status === value}
            onClick={() => onStatusChange(status === value ? '' : value)}
          >
            <span className="tile__label">
              <span className="status__dot" aria-hidden="true" />
              {FR.statuses[value]}
            </span>
            <span className="tile__value">{statuses[value]}</span>
          </button>
        ))}
      </div>

      {sites.length > 0 && (
        <div role="group" aria-label={FR.inventory.bySite} className="summary__sites">
          <span className="counters__label">{FR.inventory.bySite}</span>
          <div className="chips">
            {sites.map((entry) => (
              <button
                key={entry.site}
                type="button"
                className="chip"
                aria-pressed={site === entry.site}
                onClick={() => onSiteChange(site === entry.site ? '' : entry.site)}
              >
                {entry.site}
                <span className="chip__count">{entry.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
