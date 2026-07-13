import { env } from "../../../config/env.js";
import type { AiDebugLogger } from "./ai-debug.js";
import { redactKey, silentAiLog, truncate } from "./ai-debug.js";

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 15000;

export interface CerebrasMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CerebrasJsonSchemaFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface CerebrasChatRequest {
  model: string;
  messages: CerebrasMessage[];
  temperature?: number;
  seed?: number;
  max_tokens?: number;
  reasoning_effort?: "low" | "medium" | "high";
  response_format: CerebrasJsonSchemaFormat;
}

export interface CerebrasChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
}

export interface CerebrasErrorDetail {
  phase: "config" | "request" | "response" | "timeout" | "network";
  upstreamStatus?: number;
  upstreamBody?: string;
  model: string;
  durationMs?: number;
}

export class CerebrasError extends Error {
  readonly detail: CerebrasErrorDetail;

  constructor(
    message: string,
    readonly statusCode?: number,
    detail?: Partial<CerebrasErrorDetail>,
  ) {
    super(message);
    this.name = "CerebrasError";
    this.detail = {
      phase: detail?.phase ?? "network",
      upstreamStatus: detail?.upstreamStatus,
      upstreamBody: detail?.upstreamBody,
      model: detail?.model ?? env.cerebras.model,
      durationMs: detail?.durationMs,
    };
  }
}

export async function cerebrasChatCompletion(
  request: CerebrasChatRequest,
  log: AiDebugLogger = silentAiLog,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const apiKey = env.cerebras.apiKey;
  const started = Date.now();

  log.info(
    {
      model: request.model,
      timeoutMs,
      messageCount: request.messages.length,
      userTextLength: request.messages.find((m) => m.role === "user")?.content.length ?? 0,
      structured: request.response_format?.type === "json_schema",
      apiKey: redactKey(apiKey),
    },
    "[ai] cerebras request starting",
  );

  if (!apiKey) {
    log.error({ phase: "config" }, "[ai] CEREBRAS_API_KEY missing");
    throw new CerebrasError("Cerebras API key is not configured", 503, {
      phase: "config",
      model: request.model,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(CEREBRAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
      signal: controller.signal,
    });

    const durationMs = Date.now() - started;

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const snippet = truncate(body, 1200);
      log.error(
        {
          phase: "response",
          upstreamStatus: response.status,
          upstreamBody: snippet,
          model: request.model,
          durationMs,
        },
        "[ai] cerebras HTTP error",
      );
      throw new CerebrasError(
        body ? `Cerebras API error (${response.status}): ${truncate(body, 300)}` : `Cerebras API error (${response.status})`,
        response.status >= 500 ? 503 : 502,
        {
          phase: "response",
          upstreamStatus: response.status,
          upstreamBody: snippet,
          model: request.model,
          durationMs,
        },
      );
    }

    const raw = await response.text();
    let data: CerebrasChatResponse;
    try {
      data = JSON.parse(raw) as CerebrasChatResponse;
    } catch {
      log.error(
        { phase: "response", rawPreview: truncate(raw, 400), durationMs },
        "[ai] cerebras returned non-JSON body",
      );
      throw new CerebrasError("Cerebras returned non-JSON response", 502, {
        phase: "response",
        upstreamStatus: response.status,
        upstreamBody: truncate(raw, 1200),
        model: request.model,
        durationMs,
      });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      log.error(
        { phase: "response", choices: data.choices?.length ?? 0, durationMs },
        "[ai] cerebras empty content",
      );
      throw new CerebrasError("Empty response from Cerebras", 502, {
        phase: "response",
        upstreamStatus: response.status,
        upstreamBody: truncate(raw, 1200),
        model: request.model,
        durationMs,
      });
    }

    log.info(
      {
        model: request.model,
        durationMs,
        contentLength: content.length,
        contentPreview: truncate(content, 200),
      },
      "[ai] cerebras request ok",
    );
    return content;
  } catch (error) {
    const durationMs = Date.now() - started;
    if (error instanceof CerebrasError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      log.error({ phase: "timeout", model: request.model, durationMs, timeoutMs }, "[ai] cerebras timeout");
      throw new CerebrasError("Cerebras request timed out", 504, {
        phase: "timeout",
        model: request.model,
        durationMs,
      });
    }
    log.error(
      {
        phase: "network",
        model: request.model,
        durationMs,
        err: error instanceof Error ? error.message : String(error),
      },
      "[ai] cerebras network failure",
    );
    throw new CerebrasError(
      error instanceof Error ? error.message : "Cerebras request failed",
      503,
      { phase: "network", model: request.model, durationMs },
    );
  } finally {
    clearTimeout(timer);
  }
}
