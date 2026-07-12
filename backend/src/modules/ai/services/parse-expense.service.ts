import type {
  ExpenseCategory,
  ParseExpenseRequest,
  ParseExpenseResponse,
  SplitMethod,
} from "../ai.types.js";
import { EXPENSE_CATEGORIES } from "../ai.types.js";
import { CerebrasError, cerebrasChatCompletion } from "./cerebras.client.js";
import { env } from "../../../config/env.js";

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
    total: { type: ["number", "null"] },
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
      type: ["object", "null"],
      additionalProperties: { type: "number" },
    },
  },
} as const;

interface LlmParseResult {
  description: string;
  category: string;
  total: number | null;
  payers: { name: string; amount: number }[];
  participants: string[];
  split_method: SplitMethod;
  split_values: Record<string, number> | null;
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
2. "everyone", "all", "roommates" → all members listed above
3. If split not mentioned for a group expense → all members, equal split
4. If per-person amounts are stated → split_method "exact" with split_values keyed by member name
5. If only one payer mentioned with full amount → one entry in payers
6. description: short title from the expense (not the full sentence)
7. Do not compute equal splits — only extract stated per-person amounts for exact splits
8. total: sum of payer amounts when known; null only if amounts are unclear
9. split_values must be null when split_method is "equal"

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

  const split_method: SplitMethod = raw.split_method === "exact" ? "exact" : "equal";
  let split_values: Record<string, number> | null = null;
  const splitAmbiguous: string[] = [];
  if (split_method === "exact" && raw.split_values) {
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

  constructor(message = "Expense parsing is temporarily unavailable") {
    super(message);
    this.name = "ParseExpenseUnavailableError";
  }
}

export async function parseExpenseText(
  input: ParseExpenseRequest,
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

  let content: string;
  try {
    content = await cerebrasChatCompletion({
      model: env.cerebras.model,
      messages: [
        { role: "system", content: buildSystemPrompt(members, currencySymbol) },
        { role: "user", content: text },
      ],
      temperature: 0,
      seed: 0,
      max_tokens: 512, // TODO: Subject to test if this is sufficient for most expense parsing scenarios
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "expense_parse",
          strict: true,
          schema: EXPENSE_PARSE_JSON_SCHEMA,
        },
      },
    });
  } catch (error) {
    if (error instanceof CerebrasError) {
      throw new ParseExpenseUnavailableError(error.message);
    }
    throw error;
  }

  let parsed: LlmParseResult;
  try {
    parsed = JSON.parse(content) as LlmParseResult;
  } catch {
    throw new ParseExpenseUnavailableError("Could not parse model response");
  }

  return postProcess(parsed, members, text);
}
