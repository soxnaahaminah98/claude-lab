import { defineSecret } from 'firebase-functions/params';

/** Gemini API key. Secret Manager when deployed, `functions/.secret.local` in the emulator. */
export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
