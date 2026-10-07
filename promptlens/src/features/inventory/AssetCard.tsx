import { StatusBadge } from '../../components/StatusBadge';
import { TypeIcon } from '../../components/TypeIcon';
import { FR } from '../../copy/fr';
import { isWarrantyExpired, todayIsoDate, warrantyEndDate } from '../../domain/asset';
import type { Asset } from '../../domain/asset';
import { getCatalogueModel } from '../../domain/catalogue-data';
import { IncompleteBadge } from './IncompleteBadge';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDuplicate: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export function AssetCard({ asset, onEdit, onDuplicate, onDelete }: AssetCardProps) {
  // The warranty period only exists for assets created from a catalogue model.
  const model = getCatalogueModel(asset.modelId);
  const warrantyEnd = model ? warrantyEndDate(asset.purchaseDate, model.warrantyMonths) : null;
  const expired = warrantyEnd !== null && isWarrantyExpired(warrantyEnd, todayIsoDate());
  const name = `${asset.brand} ${asset.modelLabel}`.trim() || FR.assetEquipmentTypes[asset.equipmentType];

  return (
    <li className="card asset">
      <div className="card__head">
        <span className="card__icon">
          <TypeIcon icon={asset.equipmentType} />
        </span>
        <div className="card__title">
          <h3 className="mono">{asset.assetTag}</h3>
          <p>{name}</p>
          <IncompleteBadge asset={asset} />
        </div>
        <StatusBadge status={asset.status} />
      </div>

      <dl className="facts facts--grid">
        <div>
          <dt>{FR.inventory.serialNumber}</dt>
          <dd className="mono">{asset.serialNumber || FR.inventory.notProvided}</dd>
        </div>
        <div>
          <dt>{FR.inventory.site}</dt>
          <dd>{asset.site}</dd>
        </div>
        <div>
          <dt>{FR.inventory.assignedTo}</dt>
          <dd>{asset.assignedTo || FR.inventory.unassigned}</dd>
        </div>
        <div>
          <dt>{FR.inventory.purchaseDate}</dt>
          <dd>{asset.purchaseDate ? FR.formatDate(asset.purchaseDate) : FR.inventory.notProvided}</dd>
        </div>
        {warrantyEnd && (
          <div>
            <dt>{FR.inventory.warrantyEnd}</dt>
            <dd>
              {FR.formatDate(warrantyEnd)}
              {expired && <span className="flag"> · {FR.inventory.warrantyExpired}</span>}
            </dd>
          </div>
        )}
      </dl>

      {asset.notes && <p className="asset__notes">{asset.notes}</p>}

      <div className="card__actions">
        <button
          type="button"
          className="btn"
          aria-label={FR.inventory.editFor(asset.assetTag)}
          onClick={() => onEdit(asset)}
        >
          {FR.inventory.edit}
        </button>
        <button
          type="button"
          className="btn"
          aria-label={FR.inventory.duplicateFor(asset.assetTag)}
          onClick={() => onDuplicate(asset)}
        >
          {FR.inventory.duplicate}
        </button>
        <button
          type="button"
          className="btn btn--danger-ghost"
          aria-label={FR.inventory.removeFor(asset.assetTag)}
          onClick={() => onDelete(asset)}
        >
          {FR.inventory.remove}
        </button>
      </div>
    </li>
  );
}
