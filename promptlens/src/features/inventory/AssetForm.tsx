import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { FR } from '../../copy/fr';
import type { AiFillableField } from '../../domain/ai-description';
import {
  ASSET_STATUSES,
  applyCatalogueModel,
  findDuplicates,
  isAssetStatus,
  parseAssetDraft,
  todayIsoDate,
} from '../../domain/asset';
import type {
  Asset,
  AssetDraft,
  AssetErrors,
  AssetField,
  AssetInput,
  DuplicateWarning,
} from '../../domain/asset';
import { CATALOGUE_MODELS, getCatalogueModel } from '../../domain/catalogue-data';
import { ASSET_EQUIPMENT_TYPES, EQUIPMENT_TYPES, isAssetEquipmentType } from '../../domain/equipment';
import { AiReviewBanner } from './AiReviewBanner';

export type AssetFormMode = 'create' | 'edit' | 'duplicate';

interface AssetFormProps {
  mode: AssetFormMode;
  initial: AssetDraft;
  /** Asset being edited; excluded from the duplicate check. */
  editingId?: string;
  existingAssets: readonly Asset[];
  knownSites: readonly string[];
  /** Set when the draft comes from an AI description. */
  ai?: { confidence: number; toComplete: readonly AiFillableField[] };
  /** Resolves to `true` when the asset was saved. */
  onSubmit: (input: AssetInput) => Promise<boolean>;
  onCancel: () => void;
}

const FIELD_ORDER: readonly AssetField[] = ['equipmentType', 'site', 'assetTag', 'status', 'purchaseDate'];

function describeWarning(warning: DuplicateWarning): string {
  const { existing } = warning;
  return warning.field === 'assetTag'
    ? FR.form.duplicateTag(existing.assetTag, existing.site)
    : FR.form.duplicateSerial(existing.serialNumber, existing.assetTag, existing.site);
}

export function AssetForm({
  mode,
  initial,
  editingId,
  existingAssets,
  knownSites,
  ai,
  onSubmit,
  onCancel,
}: AssetFormProps) {
  const [values, setValues] = useState<AssetDraft>(initial);
  const [errors, setErrors] = useState<AssetErrors>({});
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);
  const [saving, setSaving] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const saveInFlight = useRef(false);
  const uid = useId();

  const fieldId = (name: string) => `${uid}-${name}`;
  const errorId = (name: string) => `${uid}-${name}-error`;

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ block: 'nearest' });
    (ai ? headingRef.current : firstFieldRef.current)?.focus();
    // Only on mount: the form is remounted (new key) for every new draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (warnings.length > 0) warningRef.current?.focus();
  }, [warnings]);

  function setValue<K extends keyof AssetDraft>(key: K, value: AssetDraft[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  /** A field the AI left empty and the user has not filled in yet. */
  function isToComplete(field: AiFillableField): boolean {
    return (ai?.toComplete.includes(field) ?? false) && values[field] === '';
  }

  function todoProps(field: AiFillableField) {
    return isToComplete(field) ? { className: 'is-todo' } : {};
  }

  function errorProps(name: AssetField) {
    return errors[name] ? { 'aria-invalid': true as const, 'aria-describedby': errorId(name) } : {};
  }

  function renderLabel(htmlFor: string, text: string, options: { field?: AiFillableField; optional?: boolean } = {}) {
    return (
      <label htmlFor={htmlFor}>
        {text}
        {options.optional && <span className="optional"> {FR.form.optional}</span>}
        {options.field && isToComplete(options.field) && <span className="todo"> {FR.form.toComplete}</span>}
      </label>
    );
  }

  function renderError(name: AssetField): ReactNode {
    const code = errors[name];
    return code ? (
      <p id={errorId(name)} className="field__error">
        {FR.errors[code]}
      </p>
    ) : null;
  }

  async function save(force: boolean) {
    if (saveInFlight.current) return;

    const parsed = parseAssetDraft(values, todayIsoDate());
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) {
      const firstInvalid = FIELD_ORDER.find((name) => parsed.errors[name]);
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    const duplicates = findDuplicates(parsed.input, existingAssets, editingId);
    if (duplicates.length > 0 && !force) {
      setWarnings(duplicates);
      return;
    }

    saveInFlight.current = true;
    setWarnings([]);
    setSaving(true);
    try {
      await onSubmit(parsed.input);
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  const title = mode === 'edit' ? FR.form.titleEdit : mode === 'duplicate' ? FR.form.titleDuplicate : ai ? FR.form.titleReview : FR.form.titleCreate;
  const hasErrors = Object.keys(errors).length > 0;
  const hasFieldsToComplete = (ai?.toComplete ?? []).some(isToComplete);

  return (
    <section ref={sectionRef} className="panel form-panel" aria-labelledby={fieldId('title')}>
      <h2 id={fieldId('title')} ref={headingRef} tabIndex={-1}>
        {title}
      </h2>
      {mode === 'duplicate' && <p className="hint">{FR.form.duplicateHint}</p>}
      {ai && <AiReviewBanner confidence={ai.confidence} hasFieldsToComplete={hasFieldsToComplete} />}
      {hasErrors && (
        <p className="form-error" role="alert">
          {FR.form.errorSummary}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field field--wide">
            {renderLabel(fieldId('modelId'), FR.form.catalogueModel, { optional: true })}
            <select
              id={fieldId('modelId')}
              ref={firstFieldRef}
              value={values.modelId}
              onChange={(event) => setValues((current) => applyCatalogueModel(current, getCatalogueModel(event.target.value)))}
            >
              <option value="">{FR.form.catalogueModelNone}</option>
              {EQUIPMENT_TYPES.map((type) => (
                <optgroup key={type} label={FR.equipmentTypes[type]}>
                  {CATALOGUE_MODELS.filter((model) => model.type === type).map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.brand} · {model.modelLabel}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="field">
            {renderLabel(fieldId('equipmentType'), FR.form.equipmentType, { field: 'equipmentType' })}
            <select
              id={fieldId('equipmentType')}
              value={values.equipmentType}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || isAssetEquipmentType(value)) setValue('equipmentType', value);
              }}
              {...todoProps('equipmentType')}
              {...errorProps('equipmentType')}
            >
              <option value="">{FR.form.equipmentTypePlaceholder}</option>
              {ASSET_EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {FR.assetEquipmentTypes[type]}
                </option>
              ))}
            </select>
            {renderError('equipmentType')}
          </div>

          <div className="field">
            {renderLabel(fieldId('brand'), FR.form.brand, { field: 'brand', optional: true })}
            <input
              id={fieldId('brand')}
              type="text"
              autoComplete="off"
              value={values.brand}
              onChange={(event) => setValue('brand', event.target.value)}
              {...todoProps('brand')}
            />
          </div>

          <div className="field">
            {renderLabel(fieldId('modelLabel'), FR.form.modelLabel, { field: 'modelLabel', optional: true })}
            <input
              id={fieldId('modelLabel')}
              type="text"
              autoComplete="off"
              value={values.modelLabel}
              onChange={(event) => setValue('modelLabel', event.target.value)}
              {...todoProps('modelLabel')}
            />
          </div>

          <div className="field">
            {renderLabel(fieldId('site'), FR.form.site)}
            <input
              id={fieldId('site')}
              type="text"
              list={fieldId('sites')}
              autoComplete="off"
              value={values.site}
              placeholder={FR.form.sitePlaceholder}
              onChange={(event) => setValue('site', event.target.value)}
              {...errorProps('site')}
            />
            <datalist id={fieldId('sites')}>
              {knownSites.map((site) => (
                <option key={site} value={site} />
              ))}
            </datalist>
            {renderError('site')}
          </div>

          <div className="field">
            {renderLabel(fieldId('status'), FR.form.status, { field: 'status' })}
            <select
              id={fieldId('status')}
              value={values.status}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || isAssetStatus(value)) setValue('status', value);
              }}
              {...todoProps('status')}
              {...errorProps('status')}
            >
              <option value="">{FR.form.statusPlaceholder}</option>
              {ASSET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {FR.statuses[status]}
                </option>
              ))}
            </select>
            {renderError('status')}
          </div>

          <div className="field">
            {renderLabel(fieldId('assetTag'), FR.form.assetTag, { field: 'assetTag' })}
            <input
              id={fieldId('assetTag')}
              type="text"
              autoComplete="off"
              value={values.assetTag}
              placeholder={FR.form.assetTagPlaceholder}
              onChange={(event) => {
                setValue('assetTag', event.target.value);
                setWarnings([]);
              }}
              {...errorProps('assetTag')}
              className={`mono${isToComplete('assetTag') ? ' is-todo' : ''}`}
            />
            {renderError('assetTag')}
          </div>

          <div className="field">
            {renderLabel(fieldId('serialNumber'), FR.form.serialNumber, { field: 'serialNumber', optional: true })}
            <input
              id={fieldId('serialNumber')}
              type="text"
              autoComplete="off"
              value={values.serialNumber}
              onChange={(event) => {
                setValue('serialNumber', event.target.value);
                setWarnings([]);
              }}
              className={`mono${isToComplete('serialNumber') ? ' is-todo' : ''}`}
            />
          </div>

          <div className="field">
            {renderLabel(fieldId('assignedTo'), FR.form.assignedTo, { optional: true })}
            <input
              id={fieldId('assignedTo')}
              type="text"
              autoComplete="off"
              value={values.assignedTo}
              placeholder={FR.form.assignedToPlaceholder}
              onChange={(event) => setValue('assignedTo', event.target.value)}
            />
          </div>

          <div className="field">
            {renderLabel(fieldId('purchaseDate'), FR.form.purchaseDate, { optional: true })}
            <input
              id={fieldId('purchaseDate')}
              type="date"
              max={todayIsoDate()}
              value={values.purchaseDate}
              onChange={(event) => setValue('purchaseDate', event.target.value)}
              {...errorProps('purchaseDate')}
            />
            {renderError('purchaseDate')}
          </div>

          <div className="field field--wide">
            {renderLabel(fieldId('notes'), FR.form.notes, { optional: true })}
            <textarea
              id={fieldId('notes')}
              rows={3}
              value={values.notes}
              onChange={(event) => setValue('notes', event.target.value)}
            />
          </div>
        </div>

        {warnings.length > 0 && (
          <div ref={warningRef} className="notice notice--warning" role="alert" tabIndex={-1}>
            <h3>{FR.form.duplicateTitle}</h3>
            <ul>
              {warnings.map((warning) => (
                <li key={warning.field}>{describeWarning(warning)}</li>
              ))}
            </ul>
            <button type="button" className="btn" disabled={saving} onClick={() => void save(true)}>
              {FR.form.saveAnyway}
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {FR.form.save}
          </button>
          <button type="button" className="btn" disabled={saving} onClick={onCancel}>
            {FR.form.cancel}
          </button>
        </div>
      </form>
    </section>
  );
}
