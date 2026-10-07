import type { Functions } from 'firebase/functions';

/** Must match the region of the Cloud Functions (functions/src/index.ts). */
export const FUNCTIONS_REGION = 'europe-west1';

/** Must match `.firebaserc`: the project ID is part of every callable URL in the emulator. */
export const EMULATOR_PROJECT_ID = 'demo-it-parc';

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 5001;

let cached: Promise<Functions | null> | undefined;

/**
 * Firebase Functions client, created on first use so the SDK stays out of the
 * initial bundle. Only the public project ID is needed: there is no API key or
 * secret in the client. Resolves to null when no project is configured.
 */
export function getFunctionsClient(): Promise<Functions | null> {
  cached ??= createFunctionsClient();
  return cached;
}

async function createFunctionsClient(): Promise<Functions | null> {
  const isDev = import.meta.env.DEV;
  const projectId = isDev ? EMULATOR_PROJECT_ID : import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  const [{ initializeApp }, { connectFunctionsEmulator, getFunctions }] = await Promise.all([
    import('firebase/app'),
    import('firebase/functions'),
  ]);
  const functions = getFunctions(initializeApp({ projectId }), FUNCTIONS_REGION);
  if (isDev) connectFunctionsEmulator(functions, EMULATOR_HOST, EMULATOR_PORT);
  return functions;
}
