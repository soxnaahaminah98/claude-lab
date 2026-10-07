import { onCall } from 'firebase-functions/v2/https';
import { CALLABLE_CORS, requireCaller } from './access';
import { execute } from './execute';
import { describeWithGemini } from './gemini';
import { parseImageInput } from './inputs';
import { IMAGE_PROMPT } from './prompts';
import { GEMINI_API_KEY } from './secrets';

/** Describe an asset from a photo of its label or nameplate (JPEG/PNG, max 4 MB). */
export const describeAssetFromImage = onCall(
  { secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '512MiB', cors: CALLABLE_CORS },
  async (request) => {
    requireCaller(request);
    return execute('describeAssetFromImage', { inputType: 'image' }, async () => {
      const image = parseImageInput(request.data);
      return describeWithGemini(
        GEMINI_API_KEY.value(),
        [
          { type: 'text', text: IMAGE_PROMPT },
          { type: 'image', data: image.base64, mime_type: image.mimeType },
        ],
        { kind: 'image' },
      );
    });
  },
);
