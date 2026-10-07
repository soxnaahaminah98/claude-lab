import { StatusBadge } from '../../components/StatusBadge';
import { TypeIcon } from '../../components/TypeIcon';
import { FR } from '../../copy/fr';
import type { Asset } from '../../domain/asset';
import { IncompleteBadge } from './IncompleteBadge';

interface AssetTableProps {
  assets: readonly Asset[];
  onEdit: (asset: Asset) => void;
  onDuplicate: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

/** Compact desktop view of the inventory. Phones use cards (see AssetCard). */
export function AssetTable({ assets, onEdit, onDuplicate, onDelete }: AssetTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="visually-hidden">{FR.inventory.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{FR.inventory.assetTag}</th>
            <th scope="col">{FR.inventory.equipment}</th>
            <th scope="col">{FR.inventory.serialNumber}</th>
            <th scope="col">{FR.inventory.site}</th>
            <th scope="col">{FR.inventory.assignedTo}</th>
            <th scope="col">{FR.inventory.statusColumn}</th>
            <th scope="col">
              <span className="visually-hidden">{FR.inventory.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const name = `${asset.brand} ${asset.modelLabel}`.trim();
            return (
              <tr key={asset.id}>
                <th scope="row" className="table__tag">
                  <span className="mono">{asset.assetTag}</span>
                  <IncompleteBadge asset={asset} />
                </th>
                <td>
                  <span className="table__equipment">
                    <span className="table__icon">
                      <TypeIcon icon={asset.equipmentType} />
                    </span>
                    <span>
                      <span className="table__name">{name || FR.assetEquipmentTypes[asset.equipmentType]}</span>
                      {name && <span className="table__sub">{FR.assetEquipmentTypes[asset.equipmentType]}</span>}
                    </span>
                  </span>
                </td>
                <td className="mono table__nowrap">{asset.serialNumber || FR.inventory.notProvided}</td>
                <td className="table__nowrap">{asset.site}</td>
                <td>{asset.assignedTo || FR.inventory.unassigned}</td>
                <td>
                  <StatusBadge status={asset.status} />
                </td>
                <td>
                  <div className="table__actions">
                    <button
                      type="button"
                      className="btn btn--sm"
                      aria-label={FR.inventory.editFor(asset.assetTag)}
                      onClick={() => onEdit(asset)}
                    >
                      {FR.inventory.edit}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm"
                      aria-label={FR.inventory.duplicateFor(asset.assetTag)}
                      onClick={() => onDuplicate(asset)}
                    >
                      {FR.inventory.duplicate}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--danger-ghost"
                      aria-label={FR.inventory.removeFor(asset.assetTag)}
                      onClick={() => onDelete(asset)}
                    >
                      {FR.inventory.remove}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
