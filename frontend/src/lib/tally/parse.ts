// Natural-language heuristic fast-path (spec §9): the trivial/local parser that
// EXTRACTS stated facts only — it never computes money (that is @/lib/core, §10).
// The Cerebras LLM path returns ParsedExpenseFacts; factsToDraft() feeds the core.

import { computeOwed } from "@/lib/core";
import { cap } from "./format";
import type { Draft, Group } from "./types";

export const EXPENSE_CATEGORIES = [
  "food",
  "grocery",
  "transport",
  "bills",
  "fun",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Structured facts from POST /ai/parse-expense (LLM extraction only). */
export interface ParsedExpenseFacts {
  description: string;
  category: ExpenseCategory;
  total: number;
  payers: { name: string; amount: number }[];
  participants: string[];
  split_method: "equal" | "exact";
  split_values: Record<string, number> | null;
  ambiguous_names: string[];
}

export interface ParsedFacts {
  title: string;
  amount: number;
  payer: string;
  parts: string[];
  per: number;
  group: Group | null;
  cat: string;
  isShared: boolean;
  unresolved: string[];
  lowConf: boolean;
}

function rosterSet(group: Group): Set<string> {
  return new Set(group.members.map((m) => m.name));
}

function totalFromFacts(facts: ParsedExpenseFacts): number {
  const paid = facts.payers.reduce((sum, p) => sum + (p.amount || 0), 0);
  return paid > 0 ? paid : Math.max(0, facts.total || 0);
}

function primaryPayerName(
  facts: ParsedExpenseFacts,
  roster: Set<string>,
): string {
  const onRoster = facts.payers.filter((p) => roster.has(p.name));
  if (onRoster.length) return onRoster[0].name;
  if (facts.payers.length) return facts.payers[0].name;
  return roster.has("You") ? "You" : [...roster][0] ?? "You";
}

/**
 * Map LLM-extracted facts → Draft. All split math via @/lib/core (no LLM).
 */
export function factsToDraft(facts: ParsedExpenseFacts, group: Group): Draft {
  const roster = rosterSet(group);
  const allMembers = group.members.length ? group.members.map((m) => m.name) : ["You"];

  const picked = facts.participants.filter((n) => roster.has(n));
  const payer = primaryPayerName(facts, roster);
  let parts = picked.length ? picked : allMembers;
  if (!parts.includes(payer)) parts = [payer, ...parts];
  parts = [...new Set(parts)];

  const total = totalFromFacts(facts);
  const method = facts.split_method === "exact" ? "exact" : "equal";

  let owed: Record<string, number>;
  if (method === "exact" && facts.split_values) {
    owed = {};
    for (const p of parts) {
      owed[p] = Math.max(0, facts.split_values[p] ?? 0);
    }
  } else {
    owed = computeOwed(total, { method: "equal", participants: parts });
  }

  const unresolved = facts.ambiguous_names.filter((n) => !roster.has(n));

  return {
    title: facts.description.trim() || "Expense",
    total,
    payer: roster.has(payer) ? payer : "You",
    parts,
    allMembers,
    method,
    cat: facts.category,
    group: group.name,
    isShared: parts.length > 1,
    unresolved,
    owed,
  };
}

function rosterFromGroups(groups: Group[]): string[] {
  return [...new Set(groups.flatMap((g) => g.members.map((m) => m.name.toLowerCase())))];
}

export function parse(textRaw: string, groups: Group[]): ParsedFacts {
  const text = (textRaw || "").trim();
  const t = text.toLowerCase();

  // amount
  let amount = 0;
  let m = t.match(/(?:paid|spent|cost|for|of|was)\s*৳?\s*(\d[\d,]*(?:\.\d+)?)/);
  if (!m) m = t.match(/৳\s*(\d[\d,]*(?:\.\d+)?)/);
  if (!m) m = t.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (m) amount = parseFloat(m[1].replace(/,/g, "")) || 0;

  // payer
  let payer = "You";
  const pm = t.match(/(\b[a-z]+\b)\s+paid/);
  if (pm) {
    const w = pm[1];
    payer = w === "i" || w === "me" ? "You" : cap(w);
  } else if (/\bi paid\b|\bi spent\b|\bmy\b/.test(t)) {
    payer = "You";
  }

  // group detection
  let group: Group | null = null;
  groups.forEach((g) => {
    if (t.includes(g.name.toLowerCase())) group = g;
  });

  // participants
  const parts: string[] = [];
  const unresolved: string[] = [];
  const roster = group ? (group as Group).members.map((mm) => mm.name.toLowerCase()) : rosterFromGroups(groups);
  // Prefer the EXPLICIT split clause (split/among/between) over "with" so a phrase
  // like "dinner with roommates, I paid 960, split roommates" splits on "split …",
  // not on "with …" (which would greedily swallow "I paid" as a phantom person).
  const splitM =
    t.match(/(?:split(?:\s+between|\s+among)?|among|between)\s+(.+)$/) ||
    t.match(/\bwith\s+(.+)$/);
  if (splitM) {
    const seg = splitM[1].replace(/\band\b/g, ",");
    seg.split(/[,/&]/).forEach((tok) => {
      const w = tok.trim().toLowerCase().replace(/[^a-z]/g, "");
      if (!w) return;
      if (/paid|spent/.test(w)) return; // payer phrase ("I paid", "spent"), not a participant
      if (w === "me" || w === "i") parts.push("You");
      else if (w.includes("roommate") && group) (group as Group).members.forEach((mm) => parts.push(mm.name));
      else if (roster.includes(w)) parts.push(cap(w));
      else if (w.length > 1) {
        parts.push(cap(w));
        unresolved.push(cap(w));
      }
    });
  }
  if (group && parts.length === 0) (group as Group).members.forEach((mm) => parts.push(mm.name));
  if (parts.length && !parts.includes(payer)) parts.unshift(payer);
  let finalParts = parts.length === 0 ? [payer] : parts;
  finalParts = [...new Set(finalParts)];

  // title
  let title = text.split(/[,–-]/)[0] || "Expense";
  title = title.replace(/\b(with|for|the)\b.*$/i, "").trim();
  title = title.replace(/\d+/g, "").trim();
  title = cap(title) || "Expense";

  // category guess
  let cat = "other";
  if (/dinner|lunch|food|restaurant|eat|breakfast|snack|cafe|coffee/.test(t)) cat = "food";
  else if (/grocer|vegetable|market|bazar/.test(t)) cat = "grocery";
  else if (/uber|bus|taxi|ride|cab|fuel|transport|rickshaw/.test(t)) cat = "transport";
  else if (/bill|rent|electric|wifi|internet/.test(t)) cat = "bills";
  else if (/movie|ticket|game|trip|fun|party/.test(t)) cat = "fun";

  const per = finalParts.length ? amount / finalParts.length : amount;
  const isShared = finalParts.length > 1;
  const lowConf = amount === 0;
  return {
    title,
    amount,
    payer,
    parts: finalParts,
    per,
    group,
    cat,
    isShared,
    unresolved: [...new Set(unresolved)],
    lowConf,
  };
}
