import { FR } from '../../copy/fr';
import { EQUIPMENT_TYPES } from '../../domain/equipment';
import type { EquipmentType } from '../../domain/equipment';

interface CatalogueFiltersProps {
  query: string;
  type: EquipmentType | '';
  onQueryChange: (query: string) => void;
  onTypeChange: (type: EquipmentType | '') => void;
}

export function CatalogueFilters({ query, type, onQueryChange, onTypeChange }: CatalogueFiltersProps) {
  return (
    <div className="filters">
      <div className="field">
        <label htmlFor="catalogue-search">{FR.catalogue.searchLabel}</label>
        <input
          id="catalogue-search"
          type="search"
          value={query}
          placeholder={FR.catalogue.searchPlaceholder}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <div role="group" aria-label={FR.catalogue.typeFilterLabel} className="chips">
        <button
          type="button"
          className="chip"
          aria-pressed={type === ''}
          onClick={() => onTypeChange('')}
        >
          {FR.catalogue.allTypes}
        </button>
        {EQUIPMENT_TYPES.map((value) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={type === value}
            onClick={() => onTypeChange(type === value ? '' : value)}
          >
            {FR.equipmentTypes[value]}
          </button>
        ))}
      </div>
    </div>
  );
}
