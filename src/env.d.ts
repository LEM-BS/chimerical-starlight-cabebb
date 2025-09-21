/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_QUOTE_FORM_ENDPOINT?: string;
  readonly PUBLIC_QUOTE_BEACON_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
