import type { FastifyBaseLogger } from "fastify";

export type AiDebugLogger = Pick<FastifyBaseLogger, "info" | "warn" | "error" | "debug">;

export const silentAiLog: AiDebugLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
};

export function truncate(text: string, max = 800): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function redactKey(key: string | undefined): string {
  if (!key) return "(missing)";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}…${key.slice(-4)} (len=${key.length})`;
}
