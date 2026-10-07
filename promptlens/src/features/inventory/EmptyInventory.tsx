import { FR } from '../../copy/fr';

interface EmptyInventoryProps {
  onAdd: () => void;
  onBrowseCatalogue: () => void;
}

/** Shown instead of the summary and filters while nothing has been logged yet. */
export function EmptyInventory({ onAdd, onBrowseCatalogue }: EmptyInventoryProps) {
  return (
    <div className="empty empty--cta">
      <h3>{FR.inventory.emptyTitle}</h3>
      <p>{FR.inventory.emptyAll}</p>
      <div className="form-actions">
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          {FR.inventory.add}
        </button>
        <button type="button" className="btn" onClick={onBrowseCatalogue}>
          {FR.inventory.browseCatalogue}
        </button>
      </div>
    </div>
  );
}
