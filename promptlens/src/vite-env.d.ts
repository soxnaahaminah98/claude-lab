/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Firebase project ID for production builds. Public identifier, not a secret. */
  readonly VITE_FIREBASE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
