import { useRef, useState } from 'react';
import { FR } from '../../copy/fr';
import { draftFromAiDescription } from '../../domain/ai-description';
import type { AiAssetDescription, AiFillableField } from '../../domain/ai-description';
import { createEmptyAssetDraft } from '../../domain/asset';
import type { Asset, AssetDraft, AssetInput } from '../../domain/asset';
import { AssetForm } from './AssetForm';
import { DescribeTextFlow } from './DescribeTextFlow';
import { LabelPhotoFlow } from './LabelPhotoFlow';

type Method = 'catalogue' | 'text' | 'image';

const METHODS: readonly { method: Method; label: string }[] = [
  { method: 'catalogue', label: FR.add.catalogue },
  { method: 'text', label: FR.add.text },
  { method: 'image', label: FR.add.image },
];

interface Review {
  /** Changes for every new draft so the form remounts with fresh values. */
  key: number;
  draft: AssetDraft;
  ai?: { confidence: number; toComplete: readonly AiFillableField[] };
}

interface AddAssetPanelProps {
  existingAssets: readonly Asset[];
  knownSites: readonly string[];
  /** Pre-fills the site, e.g. from the active site filter. */
  defaultSite: string;
  /** Draft to start from in the catalogue method, e.g. when coming from the catalogue tab. */
  initialDraft?: AssetDraft;
  onSubmit: (input: AssetInput) => Promise<boolean>;
  onCancel: () => void;
}

export function AddAssetPanel({
  existingAssets,
  knownSites,
  defaultSite,
  initialDraft,
  onSubmit,
  onCancel,
}: AddAssetPanelProps) {
  const reviewCounter = useRef(1);
  const nextKey = () => reviewCounter.current++;

  const blankDraft = (): AssetDraft => ({ ...createEmptyAssetDraft(), site: defaultSite });

  const [method, setMethod] = useState<Method>('catalogue');
  const [review, setReview] = useState<Review | null>(() => ({
    key: 0,
    draft: initialDraft ? { ...initialDraft, site: initialDraft.site || defaultSite } : blankDraft(),
  }));

  function chooseMethod(next: Method) {
    if (next === method) return;
    setMethod(next);
    setReview(next === 'catalogue' ? { key: nextKey(), draft: blankDraft() } : null);
  }

  function showAiResult(description: AiAssetDescription) {
    const { draft, toComplete } = draftFromAiDescription(description, defaultSite);
    setReview({ key: nextKey(), draft, ai: { confidence: description.confidence, toComplete } });
  }

  return (
    <section className="panel" aria-labelledby="add-asset-title">
      <h2 id="add-asset-title">{FR.add.title}</h2>

      <div role="group" aria-label={FR.add.methodLabel} className="chips method">
        {METHODS.map(({ method: value, label }) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={method === value}
            onClick={() => chooseMethod(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {review === null && method === 'text' && <DescribeTextFlow onResult={showAiResult} />}
      {review === null && method === 'image' && (
        <LabelPhotoFlow
          onResult={showAiResult}
          onEnterManually={() => setReview({ key: nextKey(), draft: blankDraft() })}
        />
      )}

      {review === null && (
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            {FR.add.cancel}
          </button>
        </div>
      )}

      {review && (
        <AssetForm
          key={review.key}
          mode="create"
          initial={review.draft}
          existingAssets={existingAssets}
          knownSites={knownSites}
          {...(review.ai ? { ai: review.ai } : {})}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </section>
  );
}
