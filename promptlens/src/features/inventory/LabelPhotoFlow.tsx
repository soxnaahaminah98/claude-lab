import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Spinner } from '../../components/Spinner';
import { FR } from '../../copy/fr';
import type { AiAssetDescription } from '../../domain/ai-description';
import { isUnreadable } from '../../domain/ai-description';
import { assetAiClient } from '../../lib/ai-client';
import { resizeToJpegBase64, validateImageFile } from '../../lib/image-resize';
import { describeAiFailure, useAiRequest } from './useAiRequest';

interface LabelPhotoFlowProps {
  onResult: (description: AiAssetDescription) => void;
  /** Continue with an empty form, when the label could not be read. */
  onEnterManually: () => void;
}

export function LabelPhotoFlow({ onResult, onEnterManually }: LabelPhotoFlowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const { busy, error, run, clearError } = useAiRequest();
  const chooseRef = useRef<HTMLInputElement>(null);
  const takeRef = useRef<HTMLInputElement>(null);

  // The preview is an object URL: release it when it changes or the flow closes.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
    if (!picked) return;

    clearError();
    setUnreadable(false);
    const invalid = validateImageFile(picked);
    if (invalid) {
      setFile(null);
      setPickError(describeAiFailure(invalid));
      return;
    }
    setPickError(null);
    setFile(picked);
  }

  async function handleAnalyse() {
    if (!file || busy) return;
    setUnreadable(false);
    const description = await run(async () => {
      const base64 = await resizeToJpegBase64(file);
      return assetAiClient.describeFromImage(base64);
    });
    if (!description) return;
    if (isUnreadable(description)) {
      setUnreadable(true);
      return;
    }
    onResult(description);
  }

  const shownError = pickError ?? error;

  return (
    <div className="flow">
      <p>{FR.photo.intro}</p>
      <p className="hint">{FR.photo.hint}</p>

      <div className="form-actions">
        <button type="button" className="btn" disabled={busy} onClick={() => chooseRef.current?.click()}>
          {FR.photo.choose}
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => takeRef.current?.click()}>
          {FR.photo.take}
        </button>
        {/* Visually hidden rather than display:none, so both stay usable with assistive tech. */}
        <input
          ref={chooseRef}
          type="file"
          accept="image/jpeg,image/png"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handlePick}
        />
        <input
          ref={takeRef}
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handlePick}
        />
      </div>

      {file && previewUrl && (
        <img className="photo-preview" src={previewUrl} alt={FR.photo.previewAlt} />
      )}

      {shownError && (
        <p className="form-error" role="alert">
          {shownError}
        </p>
      )}

      {unreadable && (
        <div className="notice" role="alert">
          <h3>{FR.photo.unreadableTitle}</h3>
          <p>{FR.photo.unreadableMessage}</p>
          <button type="button" className="btn" onClick={onEnterManually}>
            {FR.photo.enterManually}
          </button>
        </div>
      )}

      {busy && <Spinner label={FR.photo.analysing} />}

      <div className="form-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={handleAnalyse}>
          {FR.photo.analyse}
        </button>
      </div>
    </div>
  );
}
