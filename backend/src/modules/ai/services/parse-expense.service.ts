import type {
  ExpenseCategory,
  ParseExpenseRequest,
  ParseExpenseResponse,
  SplitMethod,
} from "../ai.types.js";
import { EXPENSE_CATEGORIES } from "../ai.types.js";
import { CerebrasError, cerebrasChatCompletion } from "./cerebras.client.js";
import { env } from "../../../config/env.js";
import type { AiDebugLogger } from "./ai-debug.js";
import { silentAiLog, truncate } from "./ai-debug.js";

const EXPENSE_PARSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "description",
    "category",
    "total",
    "payers",
    "participants",
    "split_method",
    "split_values",
  ],
  properties: {
    description: { type: "string" },
    category: { type: "string", enum: [...EXPENSE_CATEGORIES] },
    total: { type: "number" },
    payers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "amount"],
        properties: {
          name: { type: "string" },
          amount: { type: "number" },
        },
      },
    },
    participants: {
      type: "array",
      items: { type: "string" },
    },
    split_method: { type: "string", enum: ["equal", "exact"] },
    split_values: {
      type: "object",
      properties: {},
      additionalProperties: { type: "number" },
    },
  },
} as const;

interface LlmParseResult {
  description: string;
  category: string;
  total: number;
  payers: { name: string; amount: number }[];
  participants: string[];
  split_method: SplitMethod;
  split_values: Record<string, number>;
}

function buildSystemPrompt(members: string[], currencySymbol: string): string {
  const memberList = members.join(", ");
  return `You are an expense fact extractor for Tally, a group expense app.
Extract ONLY what the user stated. Do not invent amounts or people.

CONTEXT:
- Group members: ${memberList}
- Currency: ${currencySymbol}

CATEGORIES (pick exactly one):
- food: Food & dining (dinner, lunch, restaurant, cafe, coffee)
- grocery: Groceries (groceries, vegetables, market, bazar)
- transport: Transport (uber, taxi, bus, fuel, rickshaw)
- bills: Rent & bills (rent, electric, wifi, internet)
- fun: Fun (movie, game, party, trip)
- other: Anything else

RULES:
1. "me", "I", "my" → name "You"
2. "everyone", "all", "roommates" → all members listed above, split_method "equal"
3. If split not mentioned for a group expense → all members, equal split
4. If per-person owed amounts are stated → split_method "exact" with split_values keyed by member name (numbers = each person's SHARE of the bill, NOT cash they paid at the counter)
5. "I paid" / "Adnan paid" without a number → that person paid the FULL total. "I paid 200" means they paid ৳200 cash — do NOT treat that as their share unless they clearly mean share
6. If only one payer mentioned with full amount → one entry in payers for the full total
7. description: short title from the expense (not the full sentence)
8. Do not compute equal splits yourself — only extract stated per-person amounts for exact splits
9. total: expense bill amount (from text or sum of payer amounts when one payer paid full amount)
10. split_values: use {} when split_method is "equal"
11. participants: everyone who shares the cost (all keys in split_values for exact splits)
12. If no payer is stated but total is known → assume "You" paid the full total

EXACT SPLIT — name + amount pairs are SHARES (what each person owes):
- "breakfast 1000, Adnan 500 Arif 300 me 200" → exact, payers: You paid 1000, split_values as stated
- "breakfast 1000, I paid, Adnan 500 Arif 300 me 200" → same (I paid = You paid full 1000)
- "split Adnan 500 Arif 300 me 200" → exact with those shares
- Keywords: "split exact", "custom split", name + amount pairs

EQUAL SPLIT — use when user says everyone/equally without per-person amounts:
- "split everyone", "split equally", "split all" → equal, split_values: {}

EXAMPLES:
- "dinner 960, I paid, split everyone" → equal, You paid 960, all members
- "breakfast 1000, Adnan 500 Arif 300 me 200" → exact, You paid 1000 (default), shares as stated

Respond with JSON matching the provided schema.`;
}

function normalizeSelfName(name: string): string {
  const t = name.trim().toLowerCase();
  if (t === "me" || t === "i" || t === "myself") return "You";
  return name.trim();
}

function matchRosterName(name: string, members: string[]): string | null {
  const normalized = normalizeSelfName(name);
  if (normalized === "You" && members.includes("You")) return "You";
  const exact = members.find((m) => m.toLowerCase() === normalized.toLowerCase());
  return exact ?? null;
}

function guessCategoryFromText(text: string): ExpenseCategory {
  const t = text.toLowerCase();
  if (/dinner|lunch|food|restaurant|eat|breakfast|snack|cafe|coffee/.test(t)) return "food";
  if (/grocer|vegetable|market|bazar/.test(t)) return "grocery";
  if (/uber|bus|taxi|ride|cab|fuel|transport|rickshaw/.test(t)) return "transport";
  if (/bill|rent|electric|wifi|internet/.test(t)) return "bills";
  if (/movie|ticket|game|trip|fun|party/.test(t)) return "fun";
  return "other";
}

function normalizeCategory(raw: string, text: string): ExpenseCategory {
  const cat = raw.trim().toLowerCase();
  if ((EXPENSE_CATEGORIES as readonly string[]).includes(cat)) {
    return cat as ExpenseCategory;
  }
  return guessCategoryFromText(text);
}

function expandEveryoneToken(name: string, members: string[]): string[] | null {
  const t = name.trim().toLowerCase();
  if (t === "everyone" || t === "all" || t.includes("roommate")) return [...members];
  return null;
}

function resolveNames(
  names: string[],
  members: string[],
): { resolved: string[]; ambiguous: string[] } {
  const resolved: string[] = [];
  const ambiguous: string[] = [];

  for (const raw of names) {
    const expanded = expandEveryoneToken(raw, members);
    if (expanded) {
      resolved.push(...expanded);
      continue;
    }
    const matched = matchRosterName(raw, members);
    if (matched) resolved.push(matched);
    else if (raw.trim()) ambiguous.push(raw.trim());
  }

  return {
    resolved: [...new Set(resolved)],
    ambiguous: [...new Set(ambiguous)],
  };
}

function postProcess(
  raw: LlmParseResult,
  members: string[],
  sourceText: string,
): ParseExpenseResponse {
  const payerAmbiguous: string[] = [];
  const payers: { name: string; amount: number }[] = [];

  for (const p of raw.payers) {
    const amount = Math.max(0, Number(p.amount) || 0);
    const matched = matchRosterName(p.name, members);
    if (matched) {
      payers.push({ name: matched, amount });
    } else if (p.name.trim()) {
      payerAmbiguous.push(p.name.trim());
      payers.push({ name: normalizeSelfName(p.name), amount });
    }
  }

  const participantResolution = resolveNames(raw.participants, members);
  let participants = participantResolution.resolved;
  if (!participants.length) participants = [...members];

  const payerTotal = payers.reduce((sum, p) => sum + p.amount, 0);
  const total = payerTotal > 0 ? payerTotal : Math.max(0, Number(raw.total) || 0);

  if (!payers.length && total > 0) {
    payers.push({ name: members.includes("You") ? "You" : members[0], amount: total });
  }

  const split_method: SplitMethod =
    raw.split_method === "exact" &&
    raw.split_values &&
    Object.keys(raw.split_values).length > 0
      ? "exact"
      : "equal";
  let split_values: Record<string, number> | null = null;
  const splitAmbiguous: string[] = [];
  if (split_method === "exact" && raw.split_values && Object.keys(raw.split_values).length > 0) {
    split_values = {};
    for (const [name, amount] of Object.entries(raw.split_values)) {
      const matched = matchRosterName(name, members);
      if (matched) split_values[matched] = Math.max(0, Number(amount) || 0);
      else splitAmbiguous.push(name);
    }
  }

  const ambiguous_names = [
    ...new Set([
      ...payerAmbiguous,
      ...participantResolution.ambiguous,
      ...splitAmbiguous,
    ]),
  ];

  const description = (raw.description || "Expense").trim().slice(0, 500) || "Expense";

  return {
    description,
    category: normalizeCategory(raw.category, sourceText),
    total,
    payers,
    participants,
    split_method,
    split_values,
    ambiguous_names,
  };
}

export class ParseExpenseUnavailableError extends Error {
  readonly statusCode = 503;
  readonly code = "PARSE_UNAVAILABLE";
  readonly fallback = true;
  readonly detail?: Record<string, unknown>;

  constructor(message = "Expense parsing is temporarily unavailable", detail?: Record<string, unknown>) {
    super(message);
    this.name = "ParseExpenseUnavailableError";
    this.detail = detail;
  }
}

export async function parseExpenseText(
  input: ParseExpenseRequest,
  log: AiDebugLogger = silentAiLog,
): Promise<ParseExpenseResponse> {
  const text = input.text.trim();
  const members = input.members.map((m) => m.trim()).filter(Boolean);
  if (!text) {
    throw new Error("Text is required");
  }
  if (!members.length) {
    throw new Error("At least one group member is required");
  }

  const currencySymbol = input.currency_symbol?.trim() || "৳";

  log.info(
    {
      textPreview: truncate(text, 120),
      textLength: text.length,
      members,
      model: env.cerebras.model,
      currencySymbol,
    },
    "[ai] parse-expense start",
  );

  let content: string;
  const cerebrasRequest = {
    model: env.cerebras.model,
    messages: [
      { role: "system" as const, content: buildSystemPrompt(members, currencySymbol) },
      { role: "user" as const, content: text },
    ],
    temperature: 0,
    seed: 0,
    max_tokens: 512,
    response_format: {
      type: "json_schema" as const,
      json_schema: {
        name: "expense_parse",
        strict: false,
        schema: EXPENSE_PARSE_JSON_SCHEMA,
      },
    },
  };

  try {
    content = await cerebrasChatCompletion(cerebrasRequest, log);
  } catch (firstError) {
    if (firstError instanceof CerebrasError) {
      log.error({ message: firstError.message, cerebras: firstError.detail }, "[ai] parse-expense cerebras failed");
      throw new ParseExpenseUnavailableError(firstError.message, { cerebras: firstError.detail });
    }
    throw firstError;
  }

  let parsed: LlmParseResult;
  try {
    parsed = JSON.parse(content) as LlmParseResult;
    log.info(
      {
        description: parsed.description,
        category: parsed.category,
        total: parsed.total,
        payerCount: parsed.payers?.length ?? 0,
        participantCount: parsed.participants?.length ?? 0,
        split_method: parsed.split_method,
      },
      "[ai] parse-expense JSON ok",
    );
  } catch (parseErr) {
    log.error(
      {
        contentPreview: truncate(content, 500),
        err: parseErr instanceof Error ? parseErr.message : String(parseErr),
      },
      "[ai] parse-expense JSON parse failed",
    );
    throw new ParseExpenseUnavailableError("Could not parse model response", {
      contentPreview: truncate(content, 500),
    });
  }

  const result = postProcess(parsed, members, text);
  log.info(
    {
      description: result.description,
      total: result.total,
      category: result.category,
      participants: result.participants,
      ambiguous_names: result.ambiguous_names,
    },
    "[ai] parse-expense done",
  );
  return result;
}
