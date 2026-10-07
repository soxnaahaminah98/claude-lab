import { HttpsError } from 'firebase-functions/v2/https';
import { ASSET_DESCRIPTION_JSON_SCHEMA, normalizeDescription, parseModelOutput } from './asset-description';
import type { AssetDescription, DescriptionSource } from './asset-description';
import { MESSAGES } from './errors';
import type { ImageMimeType } from './inputs';
import { SYSTEM_INSTRUCTION } from './prompts';

/** Current Gemini Flash model (see https://ai.google.dev/gemini-api/docs/models). */
export const GEMINI_MODEL = 'gemini-3.8-flash';

const REQUEST_TIMEOUT_MS = 30_000;

export type GeminiPart =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mime_type: ImageMimeType };

/**
 * Ask Gemini for an asset description and validate what comes back.
 * Uses the Interactions API with `store: false`, so the request and the
 * answer are not kept in the interaction history on Google's side.
 */
export async function describeWithGemini(
  apiKey: string,
  parts: GeminiPart[],
  source: DescriptionSource,
): Promise<AssetDescription> {
  const key = apiKey.trim();
  if (!key) throw new HttpsError('failed-precondition', MESSAGES.keyMissing);

  // Loaded on first use: the SDK is large and would otherwise slow down
  // function discovery and every cold start, including for rejected requests.
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: key });
  const interaction = await client.interactions.create(
    {
      model: GEMINI_MODEL,
      system_instruction: SYSTEM_INSTRUCTION,
      input: parts,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: ASSET_DESCRIPTION_JSON_SCHEMA,
      },
      // Temperature is left at the API default; not tuned yet.
      generation_config: { thinking_level: 'low' },
      store: false,
    },
    { timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 },
  );

  const output = interaction.output_text;
  if (!output) throw new HttpsError('internal', MESSAGES.badOutput);

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new HttpsError('internal', MESSAGES.badOutput);
  }

  const description = parseModelOutput(parsed);
  if (!description) throw new HttpsError('internal', MESSAGES.badOutput);

  return normalizeDescription(description, source);
}
