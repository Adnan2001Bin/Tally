import axios from "axios";
import { fetchParseStatus, isParseFallbackError, parseExpenseText } from "@/lib/api/parse-expense";
import type { ParseExpenseUnavailable } from "@/lib/api/parse-expense";
import { getAccessToken } from "@/lib/auth/auth-storage";
import type { Capture, Draft, Group, TallyState } from "./types";
import { factsToDraft, normalizeGroupSplitParts, parse, type ParsedExpenseFacts } from "./parse";
import { computeOwed } from "@/lib/core";

function equalOwed(total: number, parts: string[]): Record<string, number> {
  return computeOwed(total, { method: "equal", participants: parts });
}

function syntheticGroup(members: string[], name: string | null): Group {
  return {
    id: "",
    name: name || "",
    members: members.map((memberName, i) => ({
      id: String(i),
      name: memberName,
      net: 0,
    })),
  };
}

function resolveParseContext(
  state: TallyState,
): { boundGroup: Group | null; members: string[]; groupForDraft: Group } {
  const boundGroup = state.capture?.groupId
    ? state.groups.find((g) => g.id === state.capture!.groupId) ?? null
    : null;

  if (boundGroup) {
    const members = boundGroup.members.length
      ? boundGroup.members.map((m) => m.name)
      : ["You"];
    return { boundGroup, members, groupForDraft: boundGroup };
  }

  const hint = parse(state.capture?.text || "", state.groups);
  if (hint.group) {
    const members = hint.group.members.map((m) => m.name);
    return {
      boundGroup: null,
      members: members.length ? members : ["You"],
      groupForDraft: hint.group,
    };
  }

  const members = ["You"];
  return {
    boundGroup: null,
    members,
    groupForDraft: syntheticGroup(members, null),
  };
}

function manualAmountPatch(
  capture: Capture,
  title: string,
  cat: string,
  toast: string,
): Partial<TallyState> {
  return {
    capture: {
      ...capture,
      parsing: false,
      mode: "manual",
      stage: "input",
      amount: "",
      prefill: { title, cat },
    },
    toast,
  };
}

function draftFromHeuristic(state: TallyState): Partial<TallyState> {
  const capture = state.capture!;
  const text = capture.text?.trim() || "";
  const { boundGroup } = resolveParseContext(state);
  const p = parse(text, state.groups);

  if (p.lowConf) {
    return manualAmountPatch(capture, p.title, p.cat, "Add the amount to finish");
  }

  if (boundGroup) {
    const members = boundGroup.members.map((m) => m.name);
    const roster = new Set(members);
    const { parts: splitParts, unresolved } = normalizeGroupSplitParts(
      p.parts,
      p.unresolved || [],
      members,
    );
    const payer = roster.has(p.payer) ? p.payer : "You";
    const finalParts = [...new Set(splitParts.includes(payer) ? splitParts : [payer, ...splitParts])];
    const draft: Draft = {
      title: p.title,
      total: p.amount,
      payer,
      parts: finalParts,
      allMembers: members.length ? members : ["You"],
      method: "equal",
      cat: p.cat,
      group: boundGroup.name,
      isShared: true,
      unresolved,
      owed: equalOwed(p.amount, finalParts),
    };
    return { capture: { ...capture, parsing: false, stage: "draft", draft } };
  }

  const allMembers = p.group ? p.group.members.map((m) => m.name) : [...new Set([p.payer, ...p.parts])];
  const parts = p.parts.length ? p.parts : [p.payer];
  const draft: Draft = {
    title: p.title,
    total: p.amount,
    payer: p.payer,
    parts,
    allMembers,
    method: "equal",
    cat: p.cat,
    group: p.group ? p.group.name : null,
    isShared: parts.length > 1,
    unresolved: p.unresolved || [],
    owed: equalOwed(p.amount, parts),
  };
  return { capture: { ...capture, parsing: false, stage: "draft", draft } };
}

function draftFromFacts(
  capture: Capture,
  facts: ParsedExpenseFacts,
  boundGroup: Group | null,
  groupForDraft: Group,
): Partial<TallyState> {
  if (facts.total <= 0) {
    return manualAmountPatch(
      capture,
      facts.description,
      facts.category,
      "Add the amount to finish",
    );
  }

  const draft = factsToDraft(facts, groupForDraft);
  if (!boundGroup && !draft.group) {
    draft.group = groupForDraft.name || null;
    draft.isShared = draft.parts.length > 1;
  }
  if (boundGroup) {
    draft.group = boundGroup.name;
    draft.isShared = true;
  }

  return { capture: { ...capture, parsing: false, stage: "draft", draft } };
}

export function canUseLlmParse(): boolean {
  return typeof window !== "undefined" && !!getAccessToken();
}

let llmAvailableCache: boolean | null = null;

async function llmParseEnabled(): Promise<boolean> {
  if (!canUseLlmParse()) return false;
  if (llmAvailableCache !== null) return llmAvailableCache;
  try {
    const status = await fetchParseStatus();
    llmAvailableCache = status.llm_available;
    return status.llm_available;
  } catch {
    llmAvailableCache = false;
    return false;
  }
}

/** Build store patch after parsing capture text (LLM with local fallback). */
export async function buildRunParsePatch(state: TallyState): Promise<Partial<TallyState>> {
  const text = state.capture?.text?.trim() || "";
  const capture = state.capture;

  if (!text || !capture) {
    return { toast: "Type what happened first" };
  }

  const { boundGroup, members, groupForDraft } = resolveParseContext(state);

  if (!(await llmParseEnabled())) {
    return draftFromHeuristic({ ...state, capture: { ...capture, text } });
  }

  try {
    const facts = await parseExpenseText({ text, members, currency_symbol: "৳" });
    console.info("[tally/ai] parse-expense ok", {
      description: facts.description,
      total: facts.total,
      participants: facts.participants,
    });
    return {
      ...draftFromFacts(capture, facts, boundGroup, groupForDraft),
      toast: "✓ AI understood your expense",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as ParseExpenseUnavailable | undefined;
      console.warn("[tally/ai] parse-expense failed", {
        status: error.response?.status,
        message: data?.message,
        code: data?.code,
        detail: data?.detail,
      });
    }
    if (isParseFallbackError(error)) {
      llmAvailableCache = false;
      const msg =
        axios.isAxiosError(error) &&
        (error.response?.data as { message?: string } | undefined)?.message?.includes("deprecated")
          ? "LLM model unavailable — restart backend after updating CEREBRAS_MODEL"
          : "Used offline parser";
      return {
        ...draftFromHeuristic({ ...state, capture: { ...capture, text } }),
        toast: msg,
      };
    }
    return {
      ...draftFromHeuristic({ ...state, capture: { ...capture, text } }),
      toast: "Couldn't reach parser — used offline mode",
    };
  }
}
