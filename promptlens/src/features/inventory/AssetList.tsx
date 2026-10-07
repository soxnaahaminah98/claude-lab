import { useMediaQuery } from '../../components/useMediaQuery';
import { FR } from '../../copy/fr';
import type { Asset } from '../../domain/asset';
import { AssetCard } from './AssetCard';
import { AssetTable } from './AssetTable';

/** From this width the inventory is a table; below it, cards. Keep in sync with styles.css. */
const TABLE_MEDIA_QUERY = '(min-width: 900px)';

interface AssetListProps {
  assets: readonly Asset[];
  onEdit: (asset: Asset) => void;
  onDuplicate: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export function AssetList({ assets, onEdit, onDuplicate, onDelete }: AssetListProps) {
  const showTable = useMediaQuery(TABLE_MEDIA_QUERY);

  if (assets.length === 0) {
    // An empty inventory is handled by the panel; here only the filters match nothing.
    return <p className="empty">{FR.inventory.emptyFiltered}</p>;
  }
  if (showTable) {
    return <AssetTable assets={assets} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />;
  }
  return (
    <ul className="grid">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
      ))}
    </ul>
  );
}
