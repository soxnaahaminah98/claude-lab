import { useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Spinner } from '../../components/Spinner';
import { FR } from '../../copy/fr';
import {
  applyCatalogueModel,
  createEmptyAssetDraft,
  draftFromAsset,
  toDuplicateDraft,
} from '../../domain/asset';
import type { Asset, AssetDraft, AssetInput, AssetStatus } from '../../domain/asset';
import { getCatalogueModel } from '../../domain/catalogue-data';
import type { AssetEquipmentType } from '../../domain/equipment';
import { countBySite, filterAssets } from '../../domain/inventory-stats';
import { AddAssetPanel } from './AddAssetPanel';
import { AssetForm } from './AssetForm';
import { AssetList } from './AssetList';
import { EmptyInventory } from './EmptyInventory';
import { InventoryCounters } from './InventoryCounters';
import { InventoryFilters } from './InventoryFilters';
import type { UseAssets } from './useAssets';

interface InventoryPanelProps {
  inventory: UseAssets;
  /** Catalogue model chosen before opening this tab; opens the add panel prefilled. */
  prefillModelId: string | null;
  onOpenCatalogue: () => void;
}

/** `key` changes on every open so the panel remounts with fresh values. */
type FormState =
  | { kind: 'add'; key: number; initialDraft?: AssetDraft }
  | { kind: 'edit'; key: number; asset: Asset }
  | { kind: 'duplicate'; key: number; asset: Asset };

type FormRequest =
  | { kind: 'add'; initialDraft?: AssetDraft }
  | { kind: 'edit'; asset: Asset }
  | { kind: 'duplicate'; asset: Asset };

function prefillState(modelId: string | null): FormState | null {
  if (!modelId) return null;
  const model = getCatalogueModel(modelId);
  if (!model) return null;
  return { kind: 'add', key: 0, initialDraft: applyCatalogueModel(createEmptyAssetDraft(), model) };
}

export function InventoryPanel({ inventory, prefillModelId, onOpenCatalogue }: InventoryPanelProps) {
  const { assets, loaded, error } = inventory;

  const [form, setForm] = useState<FormState | null>(() => prefillState(prefillModelId));
  const [query, setQuery] = useState('');
  const [site, setSite] = useState('');
  const [status, setStatus] = useState<AssetStatus | ''>('');
  const [type, setType] = useState<AssetEquipmentType | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const formCounter = useRef(1);

  const visibleAssets = useMemo(
    () => filterAssets(assets, { query, site, status, type }),
    [assets, query, site, status, type],
  );
  const knownSites = useMemo(() => countBySite(assets).map((entry) => entry.site), [assets]);
  const isEmpty = loaded && assets.length === 0;
  const hasFilters = query !== '' || site !== '' || status !== '' || type !== '';

  function openForm(request: FormRequest) {
    setForm({ ...request, key: formCounter.current++ });
  }

  function closeForm() {
    setForm(null);
    addButtonRef.current?.focus();
  }

  async function handleSubmit(input: AssetInput): Promise<boolean> {
    if (!form) return false;
    const saved =
      form.kind === 'edit' ? await inventory.update(form.asset.id, input) : await inventory.create(input);
    if (saved) closeForm();
    return saved;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await inventory.remove(deleteTarget.id);
    setDeleteTarget(null);
  }

  function resetFilters() {
    setQuery('');
    setSite('');
    setStatus('');
    setType('');
  }

  return (
    <section aria-labelledby="inventory-heading">
      <div className="section-head">
        <h2 id="inventory-heading">{FR.inventory.title}</h2>
        <button
          ref={addButtonRef}
          type="button"
          className="btn btn--primary"
          onClick={() => openForm({ kind: 'add' })}
        >
          {FR.inventory.add}
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {form?.kind === 'add' && (
        <AddAssetPanel
          key={form.key}
          existingAssets={assets}
          knownSites={knownSites}
          defaultSite={site}
          {...(form.initialDraft ? { initialDraft: form.initialDraft } : {})}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {form && form.kind !== 'add' && (
        <AssetForm
          key={form.key}
          mode={form.kind}
          initial={form.kind === 'edit' ? draftFromAsset(form.asset) : toDuplicateDraft(form.asset)}
          {...(form.kind === 'edit' ? { editingId: form.asset.id } : {})}
          existingAssets={assets}
          knownSites={knownSites}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {isEmpty && !form && (
        <EmptyInventory onAdd={() => openForm({ kind: 'add' })} onBrowseCatalogue={onOpenCatalogue} />
      )}

      {!isEmpty && (
        <InventoryCounters
          assets={assets}
          site={site}
          status={status}
          onSiteChange={setSite}
          onStatusChange={setStatus}
        />
      )}

      {!isEmpty && (
        <InventoryFilters
          query={query}
          site={site}
          status={status}
          type={type}
          sites={knownSites}
          canReset={hasFilters}
          onQueryChange={setQuery}
          onSiteChange={setSite}
          onStatusChange={setStatus}
          onTypeChange={setType}
          onReset={resetFilters}
        />
      )}

      {!isEmpty && (
        <p className="result-count" role="status">
          {FR.inventory.resultCount(visibleAssets.length)}
        </p>
      )}

      {!loaded && <Spinner label={FR.inventory.loading} />}

      {loaded && !isEmpty && (
        <AssetList
          assets={visibleAssets}
          onEdit={(asset) => openForm({ kind: 'edit', asset })}
          onDuplicate={(asset) => openForm({ kind: 'duplicate', asset })}
          onDelete={setDeleteTarget}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={FR.confirmDelete.title}
        message={deleteTarget ? FR.confirmDelete.message(deleteTarget.assetTag) : ''}
        confirmLabel={FR.confirmDelete.confirm}
        cancelLabel={FR.confirmDelete.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
