import { TypeIcon } from '../../components/TypeIcon';
import { FR } from '../../copy/fr';
import type { CatalogueModel } from '../../domain/equipment';

interface CatalogueCardProps {
  model: CatalogueModel;
  onAdd: (modelId: string) => void;
}

export function CatalogueCard({ model, onAdd }: CatalogueCardProps) {
  const fullName = `${model.brand} ${model.modelLabel}`;
  return (
    <li className="card">
      <div className="card__head">
        <span className="card__icon">
          <TypeIcon icon={model.icon} />
        </span>
        <div className="card__title">
          <h3>{model.brand}</h3>
          <p>{model.modelLabel}</p>
        </div>
        <span className="badge">{FR.catalogue.exampleBadge}</span>
      </div>
      <p className="card__type">{FR.equipmentTypes[model.type]}</p>
      <dl className="facts">
        <div>
          <dt>{FR.catalogue.typicalUse}</dt>
          <dd>{model.typicalUse}</dd>
        </div>
        <div>
          <dt>{FR.catalogue.recommendedWarranty}</dt>
          <dd>{FR.formatWarranty(model.warrantyMonths)}</dd>
        </div>
      </dl>
      <div className="card__actions">
        <button
          type="button"
          className="btn"
          aria-label={FR.catalogue.addToInventoryFor(fullName)}
          onClick={() => onAdd(model.id)}
        >
          {FR.catalogue.addToInventory}
        </button>
      </div>
    </li>
  );
}
