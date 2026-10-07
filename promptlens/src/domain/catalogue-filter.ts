import type { CatalogueModel, EquipmentType } from './equipment';
import { normalizeText } from './text';

export interface CatalogueFilters {
  query: string;
  /** Empty string means all types. */
  type: EquipmentType | '';
}

export function filterCatalogue(
  models: readonly CatalogueModel[],
  filters: CatalogueFilters,
): CatalogueModel[] {
  const query = normalizeText(filters.query);
  return models.filter((model) => {
    if (filters.type && model.type !== filters.type) return false;
    if (!query) return true;
    const haystack = normalizeText(`${model.brand} ${model.modelLabel} ${model.typicalUse}`);
    return haystack.includes(query);
  });
}
