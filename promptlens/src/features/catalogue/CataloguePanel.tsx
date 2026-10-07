import { useMemo, useState } from 'react';
import { FR } from '../../copy/fr';
import { CATALOGUE_MODELS } from '../../domain/catalogue-data';
import { filterCatalogue } from '../../domain/catalogue-filter';
import type { EquipmentType } from '../../domain/equipment';
import { CatalogueCard } from './CatalogueCard';
import { CatalogueFilters } from './CatalogueFilters';

interface CataloguePanelProps {
  onAddToInventory: (modelId: string) => void;
}

export function CataloguePanel({ onAddToInventory }: CataloguePanelProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<EquipmentType | ''>('');

  const models = useMemo(() => filterCatalogue(CATALOGUE_MODELS, { query, type }), [query, type]);

  return (
    <section aria-labelledby="catalogue-heading">
      <h2 id="catalogue-heading" className="visually-hidden">
        {FR.tabs.catalogue}
      </h2>
      <p className="banner">{FR.catalogue.banner}</p>
      <CatalogueFilters query={query} type={type} onQueryChange={setQuery} onTypeChange={setType} />
      <p className="result-count" role="status">
        {FR.catalogue.resultCount(models.length)}
      </p>
      {models.length === 0 ? (
        <p className="empty">{FR.catalogue.empty}</p>
      ) : (
        <ul className="grid">
          {models.map((model) => (
            <CatalogueCard key={model.id} model={model} onAdd={onAddToInventory} />
          ))}
        </ul>
      )}
    </section>
  );
}
