/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare const __API_URL__: string | undefined;

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
