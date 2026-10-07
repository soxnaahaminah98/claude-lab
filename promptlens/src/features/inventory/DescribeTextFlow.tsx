import { useState } from 'react';
import type { FormEvent } from 'react';
import { Spinner } from '../../components/Spinner';
import { FR } from '../../copy/fr';
import type { AiAssetDescription } from '../../domain/ai-description';
import { assetAiClient } from '../../lib/ai-client';
import { useAiRequest } from './useAiRequest';

/** Same limit as the backend (functions/src/inputs.ts). */
export const MAX_DESCRIPTION_LENGTH = 2000;

interface DescribeTextFlowProps {
  onResult: (description: AiAssetDescription) => void;
}

export function DescribeTextFlow({ onResult }: DescribeTextFlowProps) {
  const [text, setText] = useState('');
  const { busy, error, run } = useAiRequest();

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && text.length <= MAX_DESCRIPTION_LENGTH && !busy;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const description = await run(() => assetAiClient.describeFromText(trimmed));
    if (description) onResult(description);
  }

  return (
    <form onSubmit={handleSubmit} className="flow" noValidate>
      <div className="field">
        <label htmlFor="describe-text">{FR.describe.label}</label>
        <textarea
          id="describe-text"
          rows={5}
          value={text}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder={FR.describe.placeholder}
          aria-describedby="describe-hint describe-count"
          onChange={(event) => setText(event.target.value)}
        />
        <p id="describe-count" className="counter">
          {FR.describe.counter(text.length, MAX_DESCRIPTION_LENGTH)}
        </p>
        <p id="describe-hint" className="hint">
          {FR.describe.privacyHint}
        </p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {busy && <Spinner label={FR.describe.analysing} />}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
          {FR.describe.analyse}
        </button>
      </div>
    </form>
  );
}
