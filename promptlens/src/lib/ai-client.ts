import type { AiAssetDescription } from '../domain/ai-description';
import { parseAiDescription } from '../domain/ai-description';
import { AiError, mapCallableError } from './ai-errors';
import { getFunctionsClient } from './firebase';

/**
 * Gemini-backed asset descriptions. Gemini is only ever called from the Cloud
 * Functions: this client just calls them.
 */
export interface AssetAiClient {
  describeFromText(text: string): Promise<AiAssetDescription>;
  /** `imageBase64` is the bare base64 payload of a JPEG (no `data:` prefix). */
  describeFromImage(imageBase64: string): Promise<AiAssetDescription>;
}

/** A little longer than the function's own 60 s limit, so the server answers first. */
const CALL_TIMEOUT_MS = 65_000;

async function call(name: string, data: unknown): Promise<AiAssetDescription> {
  const functions = await getFunctionsClient();
  if (!functions) throw new AiError('not-configured');

  try {
    const { httpsCallable } = await import('firebase/functions');
    const result = await httpsCallable<unknown, unknown>(functions, name, { timeout: CALL_TIMEOUT_MS })(data);
    const description = parseAiDescription(result.data);
    if (!description) throw new AiError('bad-response');
    return description;
  } catch (error) {
    throw error instanceof AiError ? error : mapCallableError(error);
  }
}

export const assetAiClient: AssetAiClient = {
  describeFromText: (text) => call('describeAssetFromText', { text }),
  describeFromImage: (imageBase64) =>
    call('describeAssetFromImage', { imageBase64, mimeType: 'image/jpeg' }),
};
