import { env } from "../../../config/env.js";

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 5000;

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
  response_format: CerebrasJsonSchemaFormat;
}

export interface CerebrasChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
}

export class CerebrasError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "CerebrasError";
  }
}

export async function cerebrasChatCompletion(
  request: CerebrasChatRequest,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const apiKey = env.cerebras.apiKey;
  if (!apiKey) {
    throw new CerebrasError("Cerebras API key is not configured", 503);
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

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new CerebrasError(
        body ? `Cerebras API error: ${body.slice(0, 200)}` : `Cerebras API error (${response.status})`,
        response.status >= 500 ? 503 : 502,
      );
    }

    const data = (await response.json()) as CerebrasChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      throw new CerebrasError("Empty response from Cerebras", 502);
    }
    return content;
  } catch (error) {
    if (error instanceof CerebrasError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CerebrasError("Cerebras request timed out", 504);
    }
    throw new CerebrasError(
      error instanceof Error ? error.message : "Cerebras request failed",
      503,
    );
  } finally {
    clearTimeout(timer);
  }
}
