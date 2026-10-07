import { HttpsError } from 'firebase-functions/v2/https';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { MESSAGES } from './errors';

function isEmulator(): boolean {
  return process.env.FUNCTIONS_EMULATOR === 'true';
}

/**
 * CORS for the callables. Open only in the local emulator, so a page served by
 * the Vite dev server can call it. Deployed, it stays closed until a list of
 * allowed origins is chosen: an explicit `cors: false` also overrides the
 * emulator's own CORS switch, which is why this is not just `false`.
 */
export const CALLABLE_CORS = isEmulator();

/**
 * Callers must be signed in, except in the local emulator. This stops an
 * accidental deploy from exposing a public endpoint that spends the API key.
 */
export function requireCaller(request: CallableRequest<unknown>): void {
  if (isEmulator()) return;
  if (!request.auth) throw new HttpsError('unauthenticated', MESSAGES.signIn);
}
