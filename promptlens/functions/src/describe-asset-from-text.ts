import { onCall } from 'firebase-functions/v2/https';
import { CALLABLE_CORS, requireCaller } from './access';
import { execute } from './execute';
import { describeWithGemini } from './gemini';
import { parseTextInput } from './inputs';
import { buildTextPrompt } from './prompts';
import { GEMINI_API_KEY } from './secrets';

/** Describe an asset from a free-text note (model name, short problem description…). */
export const describeAssetFromText = onCall(
  { secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '512MiB', cors: CALLABLE_CORS },
  async (request) => {
    requireCaller(request);
    return execute('describeAssetFromText', { inputType: 'text' }, async () => {
      const text = parseTextInput(request.data);
      return describeWithGemini(
        GEMINI_API_KEY.value(),
        [{ type: 'text', text: buildTextPrompt(text) }],
        { kind: 'text', text },
      );
    });
  },
);
