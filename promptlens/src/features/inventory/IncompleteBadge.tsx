import { FR } from '../../copy/fr';
import { missingAssetFields } from '../../domain/asset';
import type { Asset } from '../../domain/asset';

interface IncompleteBadgeProps {
  asset: Pick<Asset, 'serialNumber' | 'brand' | 'modelLabel'>;
}

/** "À compléter" flag for a saved asset that lacks its serial number or any model information. */
export function IncompleteBadge({ asset }: IncompleteBadgeProps) {
  const missing = missingAssetFields(asset);
  if (missing.length === 0) return null;
  const detail = missing.map((field) => FR.inventory.missing[field]).join(', ');
  return (
    <span className="badge badge--todo" title={FR.inventory.missingTitle(detail)}>
      {FR.inventory.toComplete}
      <span className="visually-hidden"> ({FR.inventory.missingTitle(detail)})</span>
    </span>
  );
}
