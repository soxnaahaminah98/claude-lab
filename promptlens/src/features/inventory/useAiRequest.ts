import { useCallback, useRef, useState } from 'react';
import { FR } from '../../copy/fr';
import { AiError } from '../../lib/ai-errors';
import { ImageError } from '../../lib/image-resize';

/** Friendly French message for anything that can go wrong while analysing. */
export function describeAiFailure(error: unknown): string {
  const messages = FR.ai.errors;
  if (error instanceof ImageError) {
    if (error.kind === 'type') return messages.imageType;
    if (error.kind === 'too-large') return messages.imageTooLarge;
    return messages.imageUnreadable;
  }
  if (error instanceof AiError) {
    switch (error.kind) {
      case 'network':
        return import.meta.env.DEV ? messages.networkDev : messages.network;
      case 'invalid-input':
        return error.detail || messages.invalidInput;
      case 'unavailable':
        return messages.unavailable;
      case 'quota':
        return messages.quota;
      case 'access':
        return messages.access;
      case 'not-configured':
        return messages.notConfigured;
      case 'bad-response':
        return messages.badResponse;
      default:
        return messages.unknown;
    }
  }
  return messages.unknown;
}

/**
 * Run one analysis at a time. While a request is pending `busy` is true (use
 * it to disable buttons) and further calls are ignored, so a double click can
 * never send two requests.
 */
export function useAiRequest() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The ref blocks a second click that arrives before React re-renders `busy`.
  const running = useRef(false);

  const run = useCallback(async <T>(work: () => Promise<T>): Promise<T | null> => {
    if (running.current) return null;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      return await work();
    } catch (failure) {
      setError(describeAiFailure(failure));
      return null;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, run, clearError };
}
