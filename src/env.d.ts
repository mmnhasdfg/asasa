/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_OPENROUTER_API_KEY_2: string;
  readonly VITE_OPENROUTER_API_KEY_3: string;
  readonly VITE_OPENROUTER_API_KEY_4: string;
  readonly VITE_OPENROUTER_API_KEY_5: string;
  readonly VITE_OPENROUTER_API_KEY_6: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
