declare const __API_URL__: string | undefined;

/** API base URL — works in Vite (browser) and Orval (Node codegen). */
export function getApiBaseUrl(): string {
  if (typeof __API_URL__ !== "undefined" && __API_URL__) {
    return __API_URL__;
  }

  if (typeof process !== "undefined" && process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL;
  }

  return "http://localhost:4000";
}
