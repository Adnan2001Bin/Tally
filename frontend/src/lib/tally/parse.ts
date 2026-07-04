// Natural-language heuristic fast-path (spec §9): the trivial/local parser that
// EXTRACTS stated facts only — it never computes money (that is @/lib/core, §10).
// Ported verbatim from the mockup's parse(). The real LLM path (extract edge fn)
// returns the same fact shape and is also fed to the core.

import { cap } from "./format";
import type { Group } from "./types";

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

const knownPeople = ["jim", "paul", "rina", "sara", "tom", "maya"];

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
    payer = w === "i" || w === "me" || w === "maya" ? "You" : cap(w);
  } else if (/\bi paid\b|\bi spent\b|\bmy\b/.test(t)) {
    payer = "You";
  }

  // group detection
  let group: Group | null = null;
  groups.forEach((g) => {
    if (t.includes(g.name.toLowerCase())) group = g;
  });
  if (t.includes("roommate")) group = groups.find((g) => g.id === "roommates") ?? group;

  // participants
  const parts: string[] = [];
  const unresolved: string[] = [];
  const roster = group ? (group as Group).members.map((mm) => mm.name.toLowerCase()) : [];
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
      if (w === "me" || w === "i" || w === "maya") parts.push("You");
      else if (w.includes("roommate") && group) (group as Group).members.forEach((mm) => parts.push(mm.name));
      else if (knownPeople.includes(w)) parts.push(cap(w));
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
