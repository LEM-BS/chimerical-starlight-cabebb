/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_QUOTE_BEACON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
