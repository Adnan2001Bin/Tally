import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { computeOwed, mealCycleReconcile, personalShare, simplifyTransfers } from "@/lib/core";
import type { ExpenseEvent } from "@/lib/core";
import type { ExpenseHandlers } from "./expense-handlers";
import type { GroupHandlers } from "./group-handlers";
import {
  apiGroupExpenseToEntry,
  detailToGroup,
  draftToCreateExpenseBody,
  inviteLinkForCode,
} from "./group-mapper";
import type { GroupDetail } from "@/lib/api/models/groups/group";
import { taka } from "./format";
import { avatarColors, catColor, catIcon, catLabel, type Rel } from "./palette";
import { Icon } from "./icons";
import { parse } from "./parse";
import { groupExpenseNotifText, makeNotif, prefillText, resolveInvite } from "./social";
import type { Draft, Entry, Group, GroupMember, Screen, TallyState } from "./types";

const initialState: TallyState = {
  screen: "home",
  activeGroup: "",
  capture: null,
  toast: null,
  paid: {},
  extraEntries: [],
  apiPersonalEntries: [],
  apiGroupEntries: [],
  returned: {},
  cleared: {},
  mealMembers: [],
  newGroupName: "",
  newGroupMembers: [],
  joinCode: "",
  createTab: "start",
  borrowAdd: null,
  inviteFor: null,
  offline: false,
  entry: null,
  lastScreen: "home",
  groups: [],
  loans: [],
  things: [],
  notifications: [],
  disputed: {},
  groupCodes: {},
  joinRequests: [],
  search: "",
  displayName: null,
  appLoading: true,
  appRefreshing: false,
  profile: null,
  usernameDraft: "",
  usernameStatus: "idle",
  notifPref: true,
  monthlyBudget: null,
  editingMonthlyBudget: false,
  monthlyBudgetDraft: "",
  inviteUsername: "",
  groupInvites: {},
  myInvites: [],
  audit: [],
};

// ---- core-wired helpers ---------------------------------------------------

/** §6.2 equal split via the deterministic core (never reimplemented here). */
function equalOwed(total: number, parts: string[]): Record<string, number> {
  return computeOwed(total, { method: "equal", participants: parts });
}

function draftForGroup(
  group: Group,
  total: number,
  opts?: { title?: string; cat?: string; payer?: string; parts?: string[] },
): Draft {
  const members = group.members.length ? group.members.map((m) => m.name) : ["You"];
  const roster = new Set(members);
  const parts = opts?.parts?.filter((p) => roster.has(p)).length
    ? opts.parts.filter((p) => roster.has(p))
    : members;
  const payer = opts?.payer && roster.has(opts.payer) ? opts.payer : "You";
  const finalParts = [...new Set(parts.includes(payer) ? parts : [payer, ...parts])];
  return {
    title: opts?.title || "Expense",
    total,
    payer,
    parts: finalParts,
    allMembers: members,
    method: "equal",
    cat: opts?.cat || "other",
    group: group.name,
    isShared: true,
    unresolved: [],
    owed: equalOwed(total, finalParts),
  };
}

interface GroupViewRow {
  name: string;
  rel: Rel;
  relation: string;
  amount: number;
  sign: number;
}

/** Your-perspective balances within a group, derived from the core's transfers. */
function groupView(g: Group) {
  const balances: Record<string, number> = {};
  for (const m of g.members) balances[m.name] = m.net;
  const tx = simplifyTransfers(balances); // §6.4
  const rows: GroupViewRow[] = [];
  g.members
    .filter((m) => m.name !== "You")
    .forEach((m) => {
      const owesYou = tx.find((t) => t.from === m.name && t.to === "You");
      const youOwe = tx.find((t) => t.to === m.name && t.from === "You");
      if (owesYou) rows.push({ name: m.name, rel: "owed", relation: "owes you", amount: owesYou.amount, sign: 1 });
      else if (youOwe) rows.push({ name: m.name, rel: "owe", relation: "you owe", amount: youOwe.amount, sign: -1 });
      else rows.push({ name: m.name, rel: "settled", relation: "all settled", amount: 0, sign: 0 });
    });
  const owed = tx.filter((t) => t.to === "You").reduce((s, t) => s + t.amount, 0);
  const owe = tx.filter((t) => t.from === "You").reduce((s, t) => s + t.amount, 0);
  return { tx, rows, owed, owe, standing: owed - owe };
}

/** Home / list standing — uses API your_balance when full member list isn't loaded yet. */
function groupStandingForHome(g: Group) {
  if (g.members.length > 1) {
    const v = groupView(g);
    return { owed: v.owed, owe: v.owe, standing: v.standing };
  }
  const bal = g.yourBalance ?? 0;
  if (bal > 0) return { owed: bal, owe: 0, standing: bal };
  if (bal < 0) return { owed: 0, owe: Math.abs(bal), standing: bal };
  return { owed: 0, owe: 0, standing: 0 };
}

// ---- store hook -----------------------------------------------------------

type Patch = Partial<TallyState> | ((s: TallyState) => Partial<TallyState>);

// Module-level factory — keeps the Actions type independent of useTallyStore so
// buildView(s, a: Actions) doesn't create a circular reference.
function createActions(
  setState: React.Dispatch<React.SetStateAction<TallyState>>,
  stateRef: { current: TallyState },
  expenseHandlersRef?: React.MutableRefObject<ExpenseHandlers | null>,
  groupHandlersRef?: React.MutableRefObject<GroupHandlers | null>,
) {
  const getState = () => stateRef.current;
  const set = (patch: Patch) =>
    setState((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  const go = (screen: Screen) => set({ screen });
  const flash = (msg: string) => set({ toast: msg });
  // returned inside a functional updater to fold a toast into the patch.
  const toastPatch = (msg: string): Partial<TallyState> => ({ toast: msg });

  const openGroupExpenseAction = (groupId?: string) => {
    const gid = groupId || getState().activeGroup;
    const group = getState().groups.find((g) => g.id === gid);
    if (!gid || !group) {
      set(toastPatch("Open a group first"));
      return;
    }
    const open = () =>
      set({
        activeGroup: gid,
        capture: {
          stage: "input",
          mode: "say",
          text: "",
          amount: "",
          draft: null,
          groupId: gid,
          returnScreen: "group",
        },
      });
    const handlers = groupHandlersRef?.current;
    if (handlers?.isLive) {
      void handlers.loadGroupDetail(gid).then(open).catch((error) => {
        set(toastPatch(handlers.getErrorMessage(error)));
      });
      return;
    }
    open();
  };

  return {
    go,
    flash,
    openGroupById: (id: string) => {
      set({ activeGroup: id, screen: "group", joinRequests: [] });
      const handlers = groupHandlersRef?.current;
      if (handlers?.isLive) {
        void handlers.loadGroupDetail(id).catch((error) => {
          set(toastPatch(handlers.getErrorMessage(error)));
        });
      }
    },
    openEntry: (e: Entry) => set((s) => ({ entry: e, lastScreen: s.screen, screen: "entry" })),
    backFromEntry: () => set((s) => ({ screen: s.lastScreen || "home", entry: null })),

    // ---- settings + profile ----
    goSettings: () => set({ screen: "settings" }),
    setUsernameDraft: (v: string) => set({ usernameDraft: v, usernameStatus: "idle" }),
    checkUsername: () => {
      const name = getState().usernameDraft.trim();
      if (!name) {
        set({ usernameStatus: "idle" });
        return;
      }
      set({ usernameStatus: "available" });
    },
    saveUsername: () => {
      const name = getState().usernameDraft.trim();
      if (!name) {
        set(toastPatch("Pick a username first"));
        return;
      }
      setState((s) => ({
        ...s,
        profile: s.profile
          ? { ...s.profile, username: name }
          : { userId: "", username: name, displayName: null, email: null },
        usernameStatus: "available",
        toast: "Saved",
      }));
    },
    toggleNotifPref: () => set((s) => ({ notifPref: !s.notifPref })),

    // ---- username invites ----
    setInviteUsername: (v: string) => set({ inviteUsername: v }),
    sendUsernameInvite: () => {
      const cur = getState();
      const uname = cur.inviteUsername.trim().replace(/^@/, "");
      const gid = cur.activeGroup;
      if (!uname) {
        set(toastPatch("Enter a username to invite"));
        return;
      }
      if (!gid) {
        set(toastPatch("Pick a group first"));
        return;
      }
      const gName = cur.groups.find((x) => x.id === gid)?.name || "the group";
      const invite = {
        id: "inv" + Date.now(),
        groupId: gid,
        groupName: gName,
        username: uname,
        invitedBy: cur.profile?.username || "you",
        when: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        inviteUsername: "",
        groupInvites: { ...s.groupInvites, [gid]: [...(s.groupInvites[gid] ?? []), invite] },
        toast: `Invited @${uname} — they'll join when they accept`,
        notifications: [makeNotif(`You invited @${uname} to ${gName}`, "group"), ...s.notifications],
      }));
    },
    goInvites: () => set({ screen: "invites" }),
    acceptInvite: (id: string) => {
      const inv = getState().myInvites.find((i) => i.id === id);
      setState((s) => ({
        ...s,
        myInvites: s.myInvites.filter((i) => i.id !== id),
        notifications: inv
          ? [makeNotif(`You joined ${inv.groupName}`, "join"), ...s.notifications]
          : s.notifications,
        toast: inv ? `Joined ${inv.groupName}` : "Joined",
      }));
    },
    declineInvite: (id: string) => {
      setState((s) => ({
        ...s,
        myInvites: s.myInvites.filter((i) => i.id !== id),
        toast: "Invite declined",
      }));
    },

    // ---- audit ----
    goAudit: () => set({ screen: "audit" }),

    syncApiPersonalEntries: (entries: Entry[]) => set({ apiPersonalEntries: entries }),

    setAppLoading: (loading: boolean) => set({ appLoading: loading }),
    setAppRefreshing: (refreshing: boolean) => set({ appRefreshing: refreshing }),

    syncApiGroups: (incoming: Group[]) =>
      set((s) => {
        const byId = new Map(s.groups.map((g) => [g.id, g]));
        const groups = incoming.map((ig) => {
          const existing = byId.get(ig.id);
          if (!existing) return ig;
          return {
            ...existing,
            ...ig,
            members: existing.members.length > ig.members.length ? existing.members : ig.members,
            inviteCode: ig.inviteCode ?? existing.inviteCode,
          };
        });
        const groupCodes = { ...s.groupCodes };
        for (const g of groups) {
          if (g.inviteCode) groupCodes[g.id] = g.inviteCode;
        }
        return { groups, groupCodes };
      }),

    syncJoinRequests: (
      requests: Array<{
        id: string;
        username: string;
        display_name: string;
        created_at: string;
      }>,
    ) => set({ joinRequests: requests }),

    syncGroupDetail: (
      detail: GroupDetail,
      currentUser: { id?: string; display_name?: string } | null,
    ) =>
      set((s) => {
        const group = detailToGroup(detail, currentUser);
        const groups = s.groups.some((g) => g.id === group.id)
          ? s.groups.map((g) => (g.id === group.id ? group : g))
          : [...s.groups, group];
        const otherEntries = s.apiGroupEntries.filter((e) => e.group !== group.name);
        const newEntries = detail.expenses.map((e) =>
          apiGroupExpenseToEntry(e, group.name, group.members, currentUser),
        );
        return {
          groups,
          apiGroupEntries: [...otherEntries, ...newEntries],
          groupCodes: group.inviteCode
            ? { ...s.groupCodes, [group.id]: group.inviteCode }
            : s.groupCodes,
        };
      }),

    syncMonthlyBudget: (amount: number | null) =>
      set({ monthlyBudget: amount, monthlyBudgetDraft: amount != null ? String(amount) : "" }),

    openMonthlyBudgetEdit: () =>
      set((s) => ({
        editingMonthlyBudget: true,
        monthlyBudgetDraft: s.monthlyBudget != null ? String(s.monthlyBudget) : "",
      })),

    closeMonthlyBudgetEdit: () => set({ editingMonthlyBudget: false }),

    setMonthlyBudgetDraft: (v: string) => set({ monthlyBudgetDraft: v }),

    clearMonthlyBudget: () => set({ monthlyBudget: null, monthlyBudgetDraft: "", editingMonthlyBudget: false }),

    // capture
    openCapture: () =>
      set({ capture: { stage: "input", mode: "say", text: "", amount: "", draft: null } }),
    openGroupExpense: openGroupExpenseAction,
    closeCapture: () => set({ capture: null }),
    modeSay: () => set((s) => (s.capture ? { capture: { ...s.capture, mode: "say" } } : {})),
    modeManual: () => set((s) => (s.capture ? { capture: { ...s.capture, mode: "manual" } } : {})),
    onCaptureInput: (v: string) => set((s) => (s.capture ? { capture: { ...s.capture, text: v } } : {})),
    useExample: (txt: string) => set((s) => (s.capture ? { capture: { ...s.capture, mode: "say", text: txt } } : {})),
    runParse: () => {
      const text = getState().capture?.text || "";
      if (!text.trim()) {
        set(toastPatch("Type what happened first"));
        return;
      }
      set((s) => {
        const boundGroup = s.capture?.groupId
          ? s.groups.find((g) => g.id === s.capture!.groupId)
          : null;
        const p = parse(text, s.groups);
        if (p.lowConf) {
          return {
            capture: { ...s.capture!, mode: "manual", stage: "input", amount: "", prefill: { title: p.title, cat: p.cat } },
            ...toastPatch("Add the amount to finish"),
          };
        }
        if (boundGroup) {
          const members = boundGroup.members.map((m) => m.name);
          const roster = new Set(members);
          const picked = p.parts.filter((n) => roster.has(n));
          const parts = picked.length ? picked : members.length ? members : ["You"];
          const payer = roster.has(p.payer) ? p.payer : "You";
          const finalParts = [...new Set(parts.includes(payer) ? parts : [payer, ...parts])];
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
            unresolved: (p.unresolved || []).filter((n) => !roster.has(n)),
            owed: equalOwed(p.amount, finalParts),
          };
          return { capture: { ...s.capture!, stage: "draft", draft } };
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
        return { capture: { ...s.capture!, stage: "draft", draft } };
      });
    },
    backToInput: () => set((s) => (s.capture ? { capture: { ...s.capture, stage: "input" } } : {})),
    pressKey: (k: string) =>
      set((s) => {
        if (!s.capture) return {};
        let amt = s.capture.amount || "";
        if (k === "⌫") amt = amt.slice(0, -1);
        else if (k === ".") { if (!amt.includes(".")) amt = (amt || "0") + "."; }
        else amt = (amt === "0" ? "" : amt) + k;
        return { capture: { ...s.capture, amount: amt } };
      }),
    confirmManual: () => {
      const cap = getState().capture;
      const amt = parseFloat(cap?.amount || "0") || 0;
      if (!amt) {
        set(toastPatch("Enter an amount"));
        return;
      }
      if (cap?.groupId) {
        const group = getState().groups.find((g) => g.id === cap.groupId);
        if (!group) {
          set(toastPatch("Group not found — try again"));
          return;
        }
        set({
          capture: {
            ...cap,
            stage: "draft",
            draft: draftForGroup(group, amt, {
              title: cap.prefill?.title || "Expense",
              cat: cap.prefill?.cat || "other",
            }),
          },
        });
        return;
      }
      const handlers = expenseHandlersRef?.current;
      if (handlers?.isLive) {
        void handlers
          .createPersonal({ amount: amt, description: "Expense" })
          .then(() => set({ capture: null, screen: "home", ...toastPatch("Added " + taka(amt)) }))
          .catch((error) => set(toastPatch(handlers.getErrorMessage(error))));
        return;
      }
      set(toastPatch("Sign in to save expenses"));
    },
    confirmDraft: () => {
      const handlers = expenseHandlersRef?.current;
      set((s) => {
        const d = s.capture?.draft;
        if (!d) return {};
        const total = d.total;
        const sum = Object.values(d.owed).reduce((x, y) => x + y, 0);
        if (d.method === "exact" && sum !== total) return toastPatch("Split is off by " + taka(Math.abs(total - sum)));
        const isGroupExpense = !!(s.capture?.groupId || d.group);
        if (isGroupExpense) {
          const groupHandlers = groupHandlersRef?.current;
          const group = s.capture?.groupId
            ? s.groups.find((g) => g.id === s.capture!.groupId)
            : s.groups.find((g) => g.name === d.group);
          if (groupHandlers?.isLive) {
            if (!group) {
              return toastPatch("Open the group first, then add the expense");
            }
            const body = draftToCreateExpenseBody(d, group);
            if (!body) {
              return toastPatch("Couldn't match members — open the group and try again");
            }
            const returnScreen = s.capture?.returnScreen || "group";
            void groupHandlers
              .createGroupExpense(group.id, body)
              .then(() =>
                setState((cur) => ({
                  ...cur,
                  capture: null,
                  screen: returnScreen,
                  activeGroup: group.id,
                  toast: `Added to ${group.name}`,
                  notifications: [
                    makeNotif(
                      groupExpenseNotifText(d.title || "Expense", taka(total), group.name),
                      "expense",
                    ),
                    ...cur.notifications,
                  ],
                })),
              )
              .catch((error) => set(toastPatch(groupHandlers.getErrorMessage(error))));
            return {};
          }
        }
        if (!d.isShared && handlers?.isLive) {
          void handlers
            .createPersonal({ amount: total, description: d.title || "Expense" })
            .then(() =>
              setState((cur) => ({
                ...cur,
                capture: null,
                screen: "home",
                toast: "Added " + taka(total) + (cur.offline ? " · saved offline" : ""),
              })),
            )
            .catch((error) => set(toastPatch(handlers.getErrorMessage(error))));
          return {};
        }
        if (d.isShared) {
          const groupHandlers = groupHandlersRef?.current;
          const group = d.group
            ? getState().groups.find((g) => g.name === d.group)
            : getState().groups.find((g) => g.id === getState().activeGroup);
          if (groupHandlers?.isLive) {
            if (!group) {
              return toastPatch("Open the group first, then add the expense");
            }
            const body = draftToCreateExpenseBody(d, group);
            if (!body) {
              return toastPatch("Couldn't match members — open the group and try again");
            }
            void groupHandlers
              .createGroupExpense(group.id, body)
              .then(() =>
                setState((cur) => ({
                  ...cur,
                  capture: null,
                  screen: "home",
                  toast: "Saved · your share posted to your personal ledger",
                  notifications: d.group
                    ? [
                        makeNotif(
                          groupExpenseNotifText(d.title || "Expense", taka(total), d.group),
                          "expense",
                        ),
                        ...cur.notifications,
                      ]
                    : cur.notifications,
                })),
              )
              .catch((error) => set(toastPatch(groupHandlers.getErrorMessage(error))));
            return {};
          }
        }
        // the bridge (FR-06 / GT-7): your private share derived by the core.
        const expenseEvent: ExpenseEvent = {
          kind: "expense", id: "tmp", total,
          payers: [{ member: d.payer, amount: total }],
          split: d.method === "exact"
            ? { method: "exact", participants: d.parts, values: d.owed }
            : { method: "equal", participants: d.parts },
        };
        const yourShare = personalShare(expenseEvent, "You");
        let entry: Entry;
        if (d.isShared) {
          const youPaid = d.payer === "You";
          entry = {
            id: "n" + Date.now(), when: "Today", time: "just now", title: d.title || "Expense",
            sub: (d.group ? d.group + " · " : "") + (youPaid ? "you paid " + taka(total) : d.payer + " paid"),
            cat: d.cat, amount: youPaid ? total - yourShare : yourShare, kind: youPaid ? "owed" : "share", fresh: true,
            total, paidBy: d.payer, group: d.group ?? undefined, parts: d.parts.map((p) => ({ name: p, owed: d.owed[p] || 0 })), yourShare,
          };
        } else {
          entry = { id: "n" + Date.now(), when: "Today", time: "just now", title: d.title || "Expense", sub: "Personal", cat: d.cat, amount: total, kind: "personal", fresh: true };
        }
        const sfx = s.offline ? " · saved offline" : "";
        const msg = (d.isShared ? "Saved · your share " + taka(yourShare) : "Added " + taka(total)) + sfx;
        // notify the group when a shared expense is added (FR: activity/notification)
        const notifs =
          d.isShared && d.group
            ? [makeNotif(groupExpenseNotifText(d.title || "Expense", taka(total), d.group), "expense"), ...s.notifications]
            : s.notifications;
        return { capture: null, extraEntries: [entry, ...s.extraEntries], screen: "home", notifications: notifs, ...toastPatch(msg) };
      });
    },

    // draft editing
    setDraftMethod: (m: "equal" | "exact") =>
      set((s) => {
        if (!s.capture?.draft) return {};
        const d = { ...s.capture.draft, method: m };
        if (m === "equal") d.owed = equalOwed(d.total, d.parts);
        return { capture: { ...s.capture, draft: d } };
      }),
    setDraftPayer: (name: string) =>
      set((s) => (s.capture?.draft ? { capture: { ...s.capture, draft: { ...s.capture.draft, payer: name } } } : {})),
    toggleDraftPart: (name: string) =>
      set((s) => {
        if (!s.capture?.draft) return {};
        const d = { ...s.capture.draft };
        let parts = d.parts.includes(name) ? d.parts.filter((x) => x !== name) : [...d.parts, name];
        if (!parts.length) parts = [name];
        d.parts = parts;
        d.isShared = parts.length > 1;
        if (d.method === "equal") d.owed = equalOwed(d.total, parts);
        else { const o: Record<string, number> = {}; parts.forEach((p) => (o[p] = d.owed[p] || 0)); d.owed = o; }
        if (!parts.includes(d.payer)) d.payer = parts[0];
        return { capture: { ...s.capture, draft: d } };
      }),
    editDraftOwed: (name: string, val: string) =>
      set((s) => {
        if (!s.capture?.draft) return {};
        const d = { ...s.capture.draft, method: "exact" as const };
        d.owed = { ...d.owed, [name]: Math.max(0, Math.round(parseFloat(val) || 0)) };
        return { capture: { ...s.capture, draft: d } };
      }),
    assignName: (raw: string, member: string) =>
      set((s) => {
        if (!s.capture?.draft) return {};
        const d = { ...s.capture.draft };
        d.parts = d.parts.map((p) => (p === raw ? member : p));
        d.unresolved = (d.unresolved || []).filter((u) => u !== raw);
        const o: Record<string, number> = {};
        Object.keys(d.owed).forEach((k) => (o[k === raw ? member : k] = d.owed[k]));
        d.owed = o;
        if (d.payer === raw) d.payer = member;
        return { capture: { ...s.capture, draft: d } };
      }),

    // notifications
    goNotifications: () => set({ screen: "notifications" }),
    markNotifRead: (id: string) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllNotifRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    // dispute (immutable history — flags the entry, never mutates it)
    flagDispute: (id: string, label: string) =>
      set((s) => ({ disputed: { ...s.disputed, [id]: true }, notifications: [makeNotif(`You flagged ${label} — the group was notified`, "dispute"), ...s.notifications], ...toastPatch("Flagged for the group") })),
    resolveDispute: (id: string, label: string) =>
      set((s) => ({ disputed: { ...s.disputed, [id]: false }, notifications: [makeNotif(`Dispute on ${label} resolved`, "dispute"), ...s.notifications], ...toastPatch("Marked resolved") })),
    // QoL: search + edit (edit opens capture pre-filled → a NEW entry, never mutates)
    setSearch: (v: string) => set({ search: v }),
    editEntry: (e: Entry) => set({ screen: "home", entry: null, capture: { stage: "input", mode: "say", text: prefillText(e.title, e.amount), amount: "", draft: null } }),

    // settle / borrow / meals toggles
    markPaid: (
      key: string,
      label?: string,
      settle?: { groupId: string; fromMemberId: string; toMemberId: string; amount: number },
    ) => {
      const groupHandlers = groupHandlersRef?.current;
      if (settle && groupHandlers?.isLive) {
        void groupHandlers
          .createSettlement({
            groupId: settle.groupId,
            from_member_id: settle.fromMemberId,
            to_member_id: settle.toMemberId,
            amount: settle.amount,
          })
          .then(() =>
            setState((s) => ({
              ...s,
              paid: { ...s.paid, [key]: true },
              notifications: [
                makeNotif(label ? `Recorded: ${label}` : "Payment recorded", "settle"),
                ...s.notifications,
              ],
              toast: "Settlement recorded",
            })),
          )
          .catch((error) => set(toastPatch(groupHandlers.getErrorMessage(error))));
        return;
      }
      set((s) => {
        const now = !s.paid[key];
        return {
          paid: { ...s.paid, [key]: now },
          notifications: now
            ? [makeNotif(label ? `Recorded: ${label}` : "Payment recorded", "settle"), ...s.notifications]
            : s.notifications,
        };
      });
    },
    toggleReturned: (id: string) => set((s) => ({ returned: { ...s.returned, [id]: !s.returned[id] } })),
    toggleCleared: (id: string) => set((s) => ({ cleared: { ...s.cleared, [id]: !s.cleared[id] } })),
    openBorrowAdd: () => set({ borrowAdd: { type: "money", dir: "lent", who: "", amount: "", item: "", due: "" } }),
    closeBorrowAdd: () => set({ borrowAdd: null }),
    setBorrowType: (t: "money" | "item") => set((s) => (s.borrowAdd ? { borrowAdd: { ...s.borrowAdd, type: t } } : {})),
    setBorrowDir: (d: "lent" | "borrowed") => set((s) => (s.borrowAdd ? { borrowAdd: { ...s.borrowAdd, dir: d } } : {})),
    setBorrowField: (k: "who" | "amount" | "item" | "due", v: string) =>
      set((s) => (s.borrowAdd ? { borrowAdd: { ...s.borrowAdd, [k]: v } } : {})),
    saveBorrow: () =>
      set((s) => {
        const b = s.borrowAdd;
        if (!b) return {};
        if (b.type === "money") {
          const amt = parseFloat(b.amount || "0") || 0;
          if (!amt || !b.who.trim()) return toastPatch("Add who and how much");
          return { borrowAdd: null, loans: [{ id: "l" + Date.now(), who: b.who.trim(), dir: b.dir, amount: amt, note: "", due: b.due.trim() || null }, ...s.loans], ...toastPatch("Loan recorded") };
        }
        if (!b.item.trim() || !b.who.trim()) return toastPatch("Add the item and who");
        return { borrowAdd: null, things: [{ id: "t" + Date.now(), what: b.item.trim(), who: b.who.trim(), dir: b.dir, since: "just now" }, ...s.things], ...toastPatch("Item tracked") };
      }),

    // meals — in-memory until the meal API is wired
    logMeal: (name: string) => set((s) => ({ mealMembers: s.mealMembers.map((m) => (m.name === name ? { ...m, meals: m.meals + 1 } : m)) })),
    addGroceries: (name: string) => set((s) => ({ mealMembers: s.mealMembers.map((m) => (m.name === name ? { ...m, contributed: m.contributed + 200 } : m)) })),
    goMealClose: () => go("mealClose"),
    confirmMealClose: () => { set((s) => ({ mealMembers: s.mealMembers.map((m) => ({ ...m, meals: 0, contributed: 0 })), screen: "meals" })); flash("Cycle settled · fresh cycle started"); },
    toggleOffline: () => set((s) => ({ offline: !s.offline })),

    // create / join
    setNewGroupName: (v: string) => set({ newGroupName: v }),
    toggleNewMember: (n: string) => set((s) => ({ newGroupMembers: s.newGroupMembers.includes(n) ? s.newGroupMembers.filter((x) => x !== n) : [...s.newGroupMembers, n] })),
    setCreateTab: (t: "start" | "join") => set({ createTab: t }),
    setJoinCode: (v: string) => set({ joinCode: v }),
    createGroup: () => {
      const cur = getState();
      const name = (cur.newGroupName || "").trim() || "New group";
      const groupHandlers = groupHandlersRef?.current;
      if (groupHandlers?.isLive) {
        void groupHandlers
          .createGroup({ name })
          .then((created) =>
            set({
              activeGroup: created.id,
              inviteFor: { name: created.name, code: created.invite_code },
              screen: "invite",
              newGroupName: "",
              newGroupMembers: [],
              groupCodes: {
                ...getState().groupCodes,
                [created.id]: created.invite_code,
              },
              notifications: [
                makeNotif(`You created ${created.name}`, "group"),
                ...getState().notifications,
              ],
            }),
          )
          .catch((error) => set(toastPatch(groupHandlers.getErrorMessage(error))));
        return;
      }
      set((s) => {
        const id = "g" + Date.now();
        const members: GroupMember[] = [
          { id: "local-you", name: "You", net: 0 },
          ...s.newGroupMembers.map((n) => ({ id: `local-${n}`, name: n, net: 0 })),
        ];
        const code = "TALLY-" + Math.random().toString(36).slice(2, 6).toUpperCase();
        return {
          groups: [...s.groups, { id, name, members }],
          groupCodes: { ...s.groupCodes, [id]: code },
          activeGroup: id,
          inviteFor: { name, code },
          screen: "invite",
          newGroupName: "",
          newGroupMembers: [],
          notifications: [makeNotif(`You created ${name}`, "group"), ...s.notifications],
        };
      });
    },
    openGroupInvite: () =>
      set((s) => {
        const g = s.groups.find((x) => x.id === s.activeGroup);
        const code = g?.inviteCode || s.groupCodes[g?.id ?? ""] || "";
        if (!g || !code) return toastPatch("Invite link isn't available yet");
        return {
          inviteFor: { name: g.name, code },
          screen: "invite" as Screen,
        };
      }),
    copyInvite: () =>
      set((s) => {
        const g = s.groups.find((x) => x.id === s.activeGroup);
        const code =
          s.inviteFor?.code || g?.inviteCode || s.groupCodes[g?.id ?? ""] || "";
        const link = inviteLinkForCode(code);
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(link).catch(() => {});
        }
        return toastPatch("Invite link copied");
      }),
    respondJoinRequest: (requestId: string, action: "accept" | "reject") => {
      const gid = getState().activeGroup;
      const handlers = groupHandlersRef?.current;
      if (!handlers?.isLive || !gid) return;
      void handlers
        .respondJoinRequest(gid, requestId, action)
        .then(() =>
          set(
            toastPatch(action === "accept" ? "Member added to the group" : "Join request declined"),
          ),
        )
        .catch((error) => set(toastPatch(handlers.getErrorMessage(error))));
    },
    joinGroup: () => {
      const code = (getState().joinCode || "").trim();
      if (code.length < 4) {
        set(toastPatch("Enter the full code"));
        return;
      }
      const groupHandlers = groupHandlersRef?.current;
      if (groupHandlers?.isLive) {
        void groupHandlers
          .joinGroup({ invite_code: code })
          .then(() =>
            set({
              joinCode: "",
              screen: "groups",
              toast: "Join request sent — the admin will approve it",
            }),
          )
          .catch((error) => set(toastPatch(groupHandlers.getErrorMessage(error))));
        return;
      }
      set((s) => {
        const gid = resolveInvite(code, s.groupCodes);
        if (!gid) return { joinCode: "", ...toastPatch("No group with that code") };
        const g = s.groups.find((x) => x.id === gid)!;
        const groups = s.groups.map((x) =>
          x.id === gid && !x.members.some((m) => m.name === "You")
            ? { ...x, members: [{ id: "local-you", name: "You", net: 0 }, ...x.members] }
            : x,
        );
        return {
          groups,
          activeGroup: gid,
          screen: "group",
          joinCode: "",
          notifications: [makeNotif(`You joined ${g.name}`, "join"), ...s.notifications],
          ...toastPatch("Joined " + g.name),
        };
      });
    },
    addToGroup: () => openGroupExpenseAction(),
  };
}

export type Actions = ReturnType<typeof createActions>;

export function useTallyStore(
  userName?: string,
  options?: {
    expenseHandlersRef?: React.MutableRefObject<ExpenseHandlers | null>;
    groupHandlersRef?: React.MutableRefObject<GroupHandlers | null>;
  },
) {
  const [state, setState] = useState<TallyState>(() => ({
    ...initialState,
    displayName: userName?.trim() || null,
  }));
  // ref so async actions read the latest state without re-creating the action closures.
  // synced in an effect (not during render) — async actions run after commit, so the
  // ref is current by the time getState() is called.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  // createActions never reads stateRef.current at creation — only inside its returned
  // closures (event handlers / async), so passing the ref here is safe (rule is conservative).
  // eslint-disable-next-line react-hooks/refs
  const actions = useMemo(
    () => createActions(setState, stateRef, options?.expenseHandlersRef, options?.groupHandlersRef),
    [options?.expenseHandlersRef, options?.groupHandlersRef],
  );
  // auto-dismiss the toast (idiomatic effect — no refs touched during render)
  useEffect(() => {
    if (state.toast == null) return;
    const id = setTimeout(() => setState((p) => ({ ...p, toast: null })), 1900);
    return () => clearTimeout(id);
  }, [state.toast]);
  return { state, actions, vm: buildView(state, actions) };
}

// ---- view-model (renderVals equivalent) -----------------------------------

function buildView(s: TallyState, a: Actions) {
  const userName = s.displayName ?? "there";
  const accent = "#C2693E";
  const screen = s.screen;
  const cap0 = s.capture;
  const g = s.groups.find((x) => x.id === s.activeGroup) ?? s.groups[0] ?? { id: "", name: "", members: [] };

  // overall standing across groups
  let ovOwed = 0;
  let ovOwe = 0;
  for (const gr of s.groups) {
    const st = groupStandingForHome(gr);
    ovOwed += st.owed;
    ovOwe += st.owe;
  }
  const gv = groupView(g);
  const groupStanding = g.members.length > 1 ? gv.standing : (g.yourBalance ?? gv.standing);

  // home stream — personal ledger only (group detail keeps its own activity list)
  const q = s.search.trim().toLowerCase();
  const feedBase = [...s.apiPersonalEntries, ...s.extraEntries];
  const buildStream = () => {
    const all = feedBase.filter(
      (e) => !q || (e.title + " " + (e.sub || "")).toLowerCase().includes(q),
    );
    const order = ["Today", "Yesterday", "Earlier"];
    const sections: { label: string; items: ReturnType<typeof streamItem>[] }[] = [];
    for (const lbl of order) {
      const items = all.filter((e) => e.when === lbl).map((e) => streamItem(e));
      if (items.length) sections.push({ label: lbl, items });
    }
    return sections;
  };
  const streamItem = (e: Entry) => {
    const c = catColor[e.cat] || "#8A847A";
    const amountText = e.kind === "owed" ? "+" + taka(e.amount) : taka(e.amount);
    const amountColor = e.kind === "owed" ? "#3F8E5B" : "var(--ink)";
    return {
      id: e.id, title: e.title, sub: e.sub, disputed: !!s.disputed[e.id],
      iconEl: <Icon name={catIcon(e.cat)} color={c} size={18} />, iconBg: c + "1f",
      amountText, amountColor, anim: e.fresh ? "tallyIn .45s cubic-bezier(.22,1,.36,1)" : "none",
      open: () => a.openEntry(e),
    };
  };

  const groupBalances = gv.rows.map((r) => {
    const ac = avatarColors(r.rel);
    const color = r.sign > 0 ? "#3F8E5B" : r.sign < 0 ? "#C2693E" : "#8A847A";
    return { name: r.name, initial: r.name[0], relation: r.relation, amountText: r.amount ? taka(r.amount) : "—", color, avBg: ac.bg, avColor: ac.fg };
  });

  const settleTx = gv.tx.map((t, i) => {
    const key = g.id + "-" + i;
    const isPaid = !!s.paid[key];
    const youGet = t.to === "You";
    const youPay = t.from === "You";
    const ac = avatarColors(youGet ? "owed" : "owe");
    const fromMember = g.members.find((m) => m.name === t.from);
    const toMember = g.members.find((m) => m.name === t.to);
    const line =
      (t.from === "You" ? "You pay " : t.from + " pays ") + (t.to === "You" ? "you" : t.to);
    return {
      line,
      amountText: taka(t.amount),
      color: youGet ? "#3F8E5B" : "#C2693E",
      initial: t.from[0],
      avBg: ac.bg,
      avColor: ac.fg,
      mark: () => {
        if (!fromMember?.id || !toMember?.id) {
          a.flash("Open the group again to record this payment");
          return;
        }
        a.markPaid(key, line, {
          groupId: g.id,
          fromMemberId: fromMember.id,
          toMemberId: toMember.id,
          amount: t.amount,
        });
      },
      btnText: isPaid ? "✓ Recorded" : youGet ? "Mark received" : "Mark as paid",
      btnBg: isPaid ? "#EAF1EC" : youPay ? "var(--chip-on-bg)" : "var(--surface-card)",
      btnColor: isPaid ? "#3F8E5B" : youPay ? "var(--chip-on-fg)" : "var(--ink-soft)",
      btnBorder: isPaid ? "#CDE3D3" : youPay ? "var(--chip-on-bg)" : "var(--line-strong)",
      anim: "tallyIn .4s ease",
      showPay: youPay && !isPaid,
      pay: () => a.flash("Opening your payment app…"),
    };
  });

  const groupActivity = s.apiGroupEntries
    .filter((e) => e.group === g.name)
    .map((e) => {
    const c = catColor[e.cat] || "#8A847A";
    const amountText = e.kind === "owed" ? "+" + taka(e.amount) : taka(e.amount);
    const amountColor = e.kind === "owed" ? "#3F8E5B" : "var(--ink)";
    return { title: e.title, sub: (e.sub || "").replace(g.name + " · ", ""), iconEl: <Icon name={catIcon(e.cat)} color={c} size={18} />, iconBg: c + "1f", amountText, amountColor, open: () => a.openEntry(e) };
  });

  // spending — derived from API personal entries (current month only)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const personal = s.apiPersonalEntries.filter((e) => {
    if (!e.at) return true;
    return new Date(e.at) >= monthStart;
  });
  const spendTotal = personal.reduce((sum, e) => sum + e.amount, 0);
  const spendShared = 0;
  const spendEmpty = personal.length === 0;
  const byCat: Record<string, number> = {};
  for (const e of personal) {
    byCat[e.cat] = (byCat[e.cat] ?? 0) + e.amount;
  }
  const spendCats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      name: catLabel[cat] || "Other",
      amount,
      color: catColor[cat] || "#8A847A",
    }));
  const weekBuckets = [0, 0, 0, 0];
  for (const e of personal) {
    if (!e.at) continue;
    const d = new Date(e.at);
    if (d < monthStart) continue;
    const weekIndex = Math.min(3, Math.floor((d.getDate() - 1) / 7));
    weekBuckets[weekIndex] += e.amount;
  }
  const weekMax = Math.max(1, ...weekBuckets);
  const peakWeek = weekBuckets.indexOf(Math.max(...weekBuckets));
  const weeks = weekBuckets.map((amount, i) => ({
    h: amount === 0 ? "4%" : Math.round((amount / weekMax) * 100) + "%",
    bg: amount > 0 && i === peakWeek ? "#C2693E" : "#E2DCD0",
  }));
  const maxCat = Math.max(1, ...spendCats.map((c) => c.amount));
  const spendCatsView = spendCats.map((c) => ({ ...c, amountText: taka(c.amount), pct: Math.round((c.amount / maxCat) * 100) + "%" }));

  const monthlyBudget = s.monthlyBudget;
  const hasMonthlyBudget = monthlyBudget != null && monthlyBudget > 0;
  const budgetRemaining = hasMonthlyBudget ? Math.max(0, monthlyBudget - spendTotal) : 0;
  const budgetUsedPct = hasMonthlyBudget
    ? Math.min(100, Math.round((spendTotal / monthlyBudget) * 100))
    : 0;
  const budgetOver = hasMonthlyBudget && spendTotal > monthlyBudget;
  const monthLabel = new Date().toLocaleString("en-US", { month: "long" });

  // ---- capture draft ----
  const d = cap0?.draft || null;
  let draftView: ReturnType<typeof buildDraft> | null = null;
  function buildDraft(dd: Draft) {
    const chip = (on: boolean) => ({ bg: on ? "var(--chip-on-bg)" : "var(--surface-card)", color: on ? "var(--chip-on-fg)" : "var(--ink-soft)", border: on ? "var(--chip-on-bg)" : "var(--line-strong)" });
    const sum = Object.values(dd.owed).reduce((x, y) => x + y, 0);
    const valid = dd.method !== "exact" || sum === dd.total;
    const rows = dd.parts.map((p) => {
      const owed = dd.owed[p] || 0;
      let tag: string, color = "#8A847A";
      if (p === dd.payer && p === "You") tag = "you paid · your share";
      else if (p === dd.payer) tag = "paid the bill";
      else if (dd.payer === "You") { tag = "owes you"; color = "#C2693E"; }
      else tag = "owes " + dd.payer;
      return { name: p, tag, color, isExact: dd.method === "exact", isEqual: dd.method !== "exact", owedText: taka(owed), owedVal: String(owed) };
    });
    let statusText: string, statusColor: string;
    if (dd.method === "exact") {
      statusText = sum === dd.total ? "Adds up to " + taka(dd.total) : (sum > dd.total ? "Over by " : "Short by ") + taka(Math.abs(dd.total - sum));
      statusColor = sum === dd.total ? "#3F8E5B" : "#C2693E";
    } else {
      statusText = "Split evenly · " + taka(Math.round(dd.total / Math.max(1, dd.parts.length))) + " each";
      statusColor = "#8A847A";
    }
    const knownMembers = [
      ...new Set(
        s.groups.flatMap((gr) => gr.members.map((m) => m.name)).filter((n) => n !== "You"),
      ),
    ];
    const pool = knownMembers.length ? knownMembers : (dd.allMembers || []).filter((n) => n !== "You");
    const unresolved = (dd.unresolved || []).map((raw) => ({
      raw,
      options: [...pool.filter((x) => x !== raw), "Keep as “" + raw + "”"].map((o) => ({ name: o, assign: () => a.assignName(raw, o.startsWith("Keep") ? raw : o) })),
    }));
    return {
      title: dd.title, totalText: taka(dd.total), groupLabel: dd.group || "just you", isShared: dd.isShared, isPersonal: !dd.isShared,
      payerChips: (dd.allMembers || []).map((n) => { const c = chip(n === dd.payer); return { name: n, pick: () => a.setDraftPayer(n), ...c }; }),
      partChips: (dd.allMembers || []).map((n) => { const c = chip(dd.parts.includes(n)); return { name: n, toggle: () => a.toggleDraftPart(n), ...c }; }),
      rows, statusText, statusColor, unresolved,
      equalBg: dd.method === "equal" ? "var(--surface-card)" : "transparent", equalColor: dd.method === "equal" ? "var(--ink)" : "var(--muted)",
      exactBg: dd.method === "exact" ? "var(--surface-card)" : "transparent", exactColor: dd.method === "exact" ? "var(--ink)" : "var(--muted)",
      confirmBg: valid ? "var(--chip-on-bg)" : "#C9C2B6",
      confirmLabel: valid
        ? s.capture?.groupId
          ? "Add to group"
          : "Confirm"
        : "Balance the split first",
      editOwed: (name: string, v: string) => a.editDraftOwed(name, v),
    };
  }
  if (d) draftView = buildDraft(d);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) => ({ label: k, color: k === "." || k === "⌫" ? "var(--muted)" : "var(--ink)", press: () => a.pressKey(k) }));
  const captureGroup = cap0?.groupId ? s.groups.find((g) => g.id === cap0.groupId) : null;
  const sayExamples = (
    cap0?.groupId
      ? [
          { label: "dinner 960", txt: "dinner 960, I paid, split everyone" },
          { label: "groceries 1200", txt: "groceries 1200, split equally" },
          { label: "uber 350", txt: "uber 350, Alex paid" },
        ]
      : [
          { label: "coffee 120", txt: "coffee 120" },
          { label: "lunch 350", txt: "lunch 350" },
          { label: "groceries 1200", txt: "groceries 1200" },
        ]
  ).map((e) => ({ label: e.label, use: () => a.useExample(e.txt) }));

  // ---- entry detail ----
  const entry = s.entry;
  let entryView: {
    id: string; disputed: boolean; raw: Entry;
    shared: boolean; isPersonal: boolean; catLabel: string; catColor: string; catIcon: React.ReactNode;
    totalText: string; yourShareText: string; paidBy: string; group: string; when: string; note: string; title: string;
    rows: { name: string; initial: string; owedText: string; tag: string; color: string; you: boolean; rowBg: string }[];
  } | null = null;
  if (entry) {
    const c = catColor[entry.cat] || "#8A847A";
    const shared = !!entry.total;
    const rows = shared && entry.parts
      ? entry.parts.map((p) => {
          let tag: string, color = "#8A847A";
          if (p.name === entry.paidBy && p.name === "You") tag = "you paid · your share";
          else if (p.name === entry.paidBy) tag = "paid the bill";
          else if (entry.paidBy === "You") { tag = "owes you"; color = "#C2693E"; }
          else tag = "owes " + entry.paidBy;
          return { name: p.name, initial: p.name[0], owedText: taka(p.owed), tag, color, you: p.name === "You", rowBg: p.name === "You" ? "var(--surface-sunken)" : "var(--surface-card)" };
        })
      : [];
    entryView = {
      id: entry.id, disputed: !!s.disputed[entry.id], raw: entry,
      shared, isPersonal: !shared, catLabel: catLabel[entry.cat] || "Other", catColor: c,
      catIcon: <Icon name={catIcon(entry.cat)} color={c} size={22} />,
      totalText: taka(shared ? entry.total! : entry.amount),
      yourShareText: taka(entry.yourShare || 0), paidBy: entry.paidBy || "", group: entry.group || "",
      when: (entry.when || "") + (entry.time ? " · " + entry.time : ""), note: entry.note || "", title: entry.title, rows,
    };
  }

  // ---- hub / borrow / meals / create ----
  const hubItems = [
    { key: "borrow", iconEl: <Icon name="swap" color="var(--ink)" size={21} />, title: "Borrow", sub: "Money & things you’ve lent or borrowed", go: () => a.go("borrow") },
    { key: "meals", iconEl: <Icon name="meal" color="var(--ink)" size={21} />, title: "Meal tracker", sub: "Shared fridge · cost per meal", go: () => a.go("meals") },
    { key: "create", iconEl: <Icon name="plus" color="var(--ink)" size={21} />, title: "New group", sub: "Start one or join with a code", go: () => a.go("create") },
  ];

  const loanRows = s.loans.map((l) => {
    const cleared = !!s.cleared[l.id];
    const youLent = l.dir === "lent";
    return {
      id: l.id, who: l.who, note: l.note, line: youLent ? "You lent " + l.who : "You borrowed from " + l.who,
      amountText: taka(l.amount), color: cleared ? "#8A847A" : youLent ? "#3F8E5B" : "#C2693E",
      due: l.due ? "due " + l.due : "no due date", initial: l.who[0], avBg: youLent ? "#EAF1EC" : "#F6EBE4", avColor: youLent ? "#3F8E5B" : "#C2693E",
      cleared, btnText: cleared ? "✓ Cleared" : "Mark settled", mark: () => a.toggleCleared(l.id), strike: cleared ? "line-through" : "none",
    };
  });
  const thingRows = s.things.map((t) => {
    const ret = !!s.returned[t.id];
    const youLent = t.dir === "lent";
    return {
      id: t.id, what: t.what, line: youLent ? "Lent to " + t.who : "Borrowed from " + t.who, since: t.since, initial: t.what[0],
      ret, btnText: ret ? "✓ " + (youLent ? "Back" : "Returned") : youLent ? "Got it back" : "Returned it",
      mark: () => a.toggleReturned(t.id), strike: ret ? "line-through" : "none", opacity: ret ? ".5" : "1",
    };
  });

  const mealSrc = s.mealMembers.map((m) => ({
    key: m.name,
    name: m.name,
    meals: m.meals,
    contributed: m.contributed,
    regular: false,
  }));
  const mealEmpty = mealSrc.length === 0;
  const meal = mealCycleReconcile({
    members: mealSrc.map((m) => m.key),
    mealPurchases: mealSrc.map((m) => ({ member: m.key, amount: m.contributed })),
    meals: mealSrc.map((m) => ({ member: m.key, count: m.meals })),
  });
  const mealNameByKey: Record<string, string> = Object.fromEntries(mealSrc.map((m) => [m.key, m.name]));
  const mealRows = mealSrc.map((m) => {
    const bal = meal.cycleNet[m.key] ?? 0;
    return {
      key: m.key, name: m.name, regular: m.regular,
      meals: m.meals + " meals", contributed: taka(m.contributed),
      balanceText: (bal >= 0 ? "+" : "−") + taka(Math.abs(bal)), balanceColor: bal >= 0 ? "#3F8E5B" : "#C2693E",
      logMeal: () => a.logMeal(m.name),
      addG: () => a.addGroceries(m.name),
      toggleRegular: undefined,
      canToggleRegular: false,
      initial: m.name[0],
      avBg: bal >= 0 ? "#EAF1EC" : "#F6EBE4", avColor: bal >= 0 ? "#3F8E5B" : "#C2693E",
    };
  });
  const mealLineName = (key: string) => (mealNameByKey[key] ?? key);
  const mealSettle = meal.transfers.map((t) => {
    const fromName = mealLineName(t.from);
    const toName = mealLineName(t.to);
    return {
      line: (fromName === "You" ? "You pay " : fromName + " pays ") + (toName === "You" ? "you" : toName),
      amountText: taka(t.amount), color: toName === "You" ? "#3F8E5B" : "#C2693E", initial: fromName[0],
      avBg: toName === "You" ? "#EAF1EC" : "#F6EBE4", avColor: toName === "You" ? "#3F8E5B" : "#C2693E",
    };
  });
  const mealRegularCount = mealSrc.filter((m) => m.regular).length;
  const mealMe = mealSrc.find((m) => m.name === "You");
  const mealHasMe = !!mealMe;
  const logMealMe = () => a.logMeal("You");
  const addGrocMe = () => a.addGroceries("You");

  const memberPool = [
    ...new Set(
      s.groups.flatMap((gr) => gr.members.map((m) => m.name)).filter((n) => n !== "You"),
    ),
  ];
  const createMembers = memberPool.map((n) => {
    const on = s.newGroupMembers.includes(n);
    return { name: n, on, toggle: () => a.toggleNewMember(n), bg: on ? "var(--chip-on-bg)" : "var(--surface-card)", color: on ? "var(--chip-on-fg)" : "var(--ink-soft)", border: on ? "var(--chip-on-bg)" : "var(--line-strong)" };
  });

  // ---- username invites (Create screen + Invites surface) ----
  const groupPendingInvites = (s.groupInvites[g.id] ?? []).map((i) => ({ id: i.id, username: i.username, when: i.when }));
  const myInviteRows = s.myInvites.map((i) => ({
    id: i.id, groupName: i.groupName, byLine: `@${i.invitedBy} invited you`, when: i.when,
    accept: () => a.acceptInvite(i.id), decline: () => a.declineInvite(i.id),
  }));

  // ---- settings ----
  const profileEmail = s.profile?.email || "";
  const profileUsername = s.profile?.username || "";
  const usernameStatusText =
    s.usernameStatus === "checking" ? "Checking…"
    : s.usernameStatus === "available" ? "Available"
    : s.usernameStatus === "taken" ? "Already taken"
    : "";
  const usernameStatusColor = s.usernameStatus === "taken" ? "#C2693E" : s.usernameStatus === "available" ? "#3F8E5B" : "var(--muted)";

  // ---- audit timeline ----
  const auditKindLabel: Record<string, string> = {
    expense: "Added", correction: "Changed", dispute: "Flagged",
    settlement: "Settled", "member-joined": "Joined", "member-invited": "Invited",
  };
  const auditRows = s.audit.map((ev) => ({
    id: ev.id, kindLabel: auditKindLabel[ev.kind] || "Update", kind: ev.kind,
    summary: ev.summary, when: ev.when, before: ev.before, after: ev.after,
    hasChange: !!(ev.before || ev.after),
    dot: ev.kind === "dispute" ? "#C2693E" : ev.kind === "settlement" ? "#3F8E5B" : ev.kind === "correction" ? "#C9A24B" : "var(--muted-2)",
  }));

  // borrow add overlay tab/dir chip colors
  const ba = s.borrowAdd;
  const baMoney = !!ba && ba.type === "money";
  const baItem = !!ba && ba.type === "item";
  const baTab = (on: boolean) => ({ bg: on ? "var(--surface-card)" : "transparent", color: on ? "var(--ink)" : "var(--muted)" });
  const baDir = (on: boolean) => ({ bg: on ? "var(--chip-on-bg)" : "var(--surface-card)", color: on ? "var(--chip-on-fg)" : "var(--ink-soft)", border: on ? "var(--chip-on-bg)" : "var(--line-strong)" });

  return {
    userName, accent,
    appLoading: s.appLoading,
    appRefreshing: s.appRefreshing,
    // screen flags
    screen,
    isHome: screen === "home", isSpending: screen === "spending", isGroups: screen === "groups", isGroup: screen === "group",
    isSettle: screen === "settle", isHub: screen === "hub", isBorrow: screen === "borrow", isMeals: screen === "meals",
    isCreate: screen === "create", isEntry: screen === "entry", isMealClose: screen === "mealClose", isInvite: screen === "invite",
    isNotifications: screen === "notifications",
    isSettings: screen === "settings", isInvites: screen === "invites", isAudit: screen === "audit",
    showNav: !cap0 && !ba && screen !== "entry" && screen !== "invite" && screen !== "mealClose",
    capture: cap0, captureOpen: !!cap0, captureInput: cap0?.stage === "input", captureDraft: cap0?.stage === "draft",
    modeIsSay: cap0?.mode === "say", modeIsManual: cap0?.mode === "manual",
    captureText: cap0?.text || "", manualAmount: cap0?.amount || "0",
    captureGroupName: captureGroup?.name || "",
    captureIsGroupExpense: !!cap0?.groupId,
    openGroupExpense: a.openGroupExpense,
    sayBg: cap0?.mode === "say" ? "var(--surface-card)" : "transparent", sayColor: cap0?.mode === "say" ? "var(--ink)" : "var(--muted)",
    manualBg: cap0?.mode === "manual" ? "var(--surface-card)" : "transparent", manualColor: cap0?.mode === "manual" ? "var(--ink)" : "var(--muted)",

    // nav colors
    navHome: screen === "home" ? "var(--ink)" : "var(--muted-2)",
    navSpend: screen === "spending" ? "var(--ink)" : "var(--muted-2)",
    navGroups: ["groups", "group", "settle", "audit"].includes(screen) ? "var(--ink)" : "var(--muted-2)",
    navHub: ["hub", "borrow", "meals", "create", "settings", "invites"].includes(screen) ? "var(--ink)" : "var(--muted-2)",
    // nav icons
    homeIcon: <Icon name="home" color={screen === "home" ? "var(--ink)" : "var(--muted-2)"} size={21} />,
    spendIcon: <Icon name="chart" color={screen === "spending" ? "var(--ink)" : "var(--muted-2)"} size={21} />,
    groupsIcon: <Icon name="groups" color={["groups", "group", "settle", "audit"].includes(screen) ? "var(--ink)" : "var(--muted-2)"} size={21} />,
    moreIcon: <Icon name="grid" color={["hub", "borrow", "meals", "create", "settings", "invites"].includes(screen) ? "var(--ink)" : "var(--muted-2)"} size={21} />,
    plusIcon: <Icon name="plus" color="#fff" size={26} />,
    // nav + flow handlers (mirror the mockup's renderVals)
    goHome: () => a.go("home"), goSpending: () => a.go("spending"), goGroups: () => a.go("groups"),
    goHub: () => a.go("hub"), goGroup: () => a.go("group"), goSettle: () => a.go("settle"),
    goCreate: () => a.go("create"), goMeals: () => a.go("meals"), goMealClose: a.goMealClose,
    goActiveGroup: () => a.go("group"), backFromEntry: a.backFromEntry,
    setStartTab: () => a.setCreateTab("start"), setJoinTab: () => a.setCreateTab("join"),
    goSettings: a.goSettings, goInvites: a.goInvites, goAudit: a.goAudit,

    // home
    homeMood: ovOwe > ovOwed ? "a little behind this week" : ovOwed > 0 ? "you’re ahead overall" : "all caught up",
    owedText: taka(ovOwed), oweText: taka(ovOwe), streamSections: buildStream(),

    // spending
    spendTotalText: spendTotal.toLocaleString("en-US"), spendShared, spendSharedText: taka(spendShared),
    spendCats: spendCatsView, weeks, spendEmpty,
    monthLabel,
    hasMonthlyBudget,
    monthlyBudgetText: hasMonthlyBudget ? taka(monthlyBudget) : "",
    budgetRemainingText: taka(budgetRemaining),
    budgetUsedPct: budgetUsedPct + "%",
    budgetOver,
    budgetBarColor: budgetOver ? "#C2693E" : "#3F8E5B",
    editingMonthlyBudget: s.editingMonthlyBudget,
    monthlyBudgetDraft: s.monthlyBudgetDraft,
    openMonthlyBudgetEdit: a.openMonthlyBudgetEdit,
    closeMonthlyBudgetEdit: a.closeMonthlyBudgetEdit,
    setMonthlyBudgetDraft: a.setMonthlyBudgetDraft,
    clearMonthlyBudget: a.clearMonthlyBudget,
    syncMonthlyBudget: a.syncMonthlyBudget,

    // groups
    groupCards: s.groups.map((gr) => {
      const st = groupStandingForHome(gr);
      const membersLabel =
        gr.memberCount && gr.members.length <= 1
          ? `${gr.memberCount} member${gr.memberCount === 1 ? "" : "s"}`
          : gr.members.map((m) => m.name).join(", ");
      return {
        id: gr.id,
        name: gr.name,
        members: membersLabel,
        color: st.standing > 0 ? "#3F8E5B" : st.standing < 0 ? "#C2693E" : "#8A847A",
        label: st.standing > 0 ? "YOU’RE OWED" : st.standing < 0 ? "YOU OWE" : "SETTLED",
        amountText: st.standing === 0 ? "—" : taka(Math.abs(st.standing)),
        open: () => a.openGroupById(gr.id),
      };
    }),
    groupName: g.name,
    groupMembers:
      g.memberCount && g.members.length <= 1
        ? `${g.memberCount} members`
        : g.members.map((m) => m.name).join(", "),
    groupStandingLabel: groupStanding > 0 ? "Overall, you’re owed" : groupStanding < 0 ? "Overall, you owe" : "You’re all settled",
    groupStandingText: groupStanding === 0 ? "৳0" : taka(Math.abs(groupStanding)),
    groupStandingColor: groupStanding > 0 ? "#3F8E5B" : groupStanding < 0 ? "#C2693E" : "#8A847A",
    groupBalances, groupActivity, groupHasActivity: groupActivity.length > 0,
    settleTx, settleSummary: settleTx.length === 1 ? "One payment clears everyone." : settleTx.length + " payments clear everyone.",

    canManageJoinRequests:
      g.members.find((m) => m.name === "You")?.role === "owner" ||
      g.members.find((m) => m.name === "You")?.role === "admin",
    joinRequestRows: s.joinRequests.map((r) => ({
      id: r.id,
      name: r.display_name?.trim() || r.username,
      username: r.username,
      when: new Date(r.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      accept: () => a.respondJoinRequest(r.id, "accept"),
      reject: () => a.respondJoinRequest(r.id, "reject"),
    })),
    groupHasJoinRequests: s.joinRequests.length > 0,
    openGroupInvite: a.openGroupInvite,
    groupInviteCode: g.inviteCode || s.groupCodes[g.id] || "",

    // draft
    draft: draftView, keys, sayExamples,

    // entry
    entry: entryView,

    // hub / borrow / meals / create
    hubItems, loanRows, thingRows, mealRows, mealSettle,
    mealCpmText: taka(meal.mealRate), mealTotalFood: taka(meal.totalPool), mealTotalMeals: meal.totalMeals, mcCpmText: taka(meal.mealRate),
    // meals as a group feature
    mealEmpty, mealGroupName: g.name, mealRegularCount, mealHasMe, logMealMe, addGrocMe,
    mealRegularHint: mealRegularCount > 0 ? `${mealRegularCount} regular ${mealRegularCount === 1 ? "eater is" : "eaters are"} counted in automatically` : "Mark who eats here every day — they're counted in automatically",
    createMembers, newGroupName: s.newGroupName, joinCode: s.joinCode,
    // username invites (Create screen)
    inviteUsername: s.inviteUsername, setInviteUsername: a.setInviteUsername, sendUsernameInvite: a.sendUsernameInvite,
    groupPendingInvites,
    createIsStart: s.createTab === "start", createIsJoin: s.createTab === "join",
    startTabBg: s.createTab === "start" ? "var(--surface-card)" : "transparent", startTabColor: s.createTab === "start" ? "var(--ink)" : "var(--muted)",
    joinTabBg: s.createTab === "join" ? "var(--surface-card)" : "transparent", joinTabColor: s.createTab === "join" ? "var(--ink)" : "var(--muted)",

    // borrow add
    borrowAddOpen: !!ba, baMoney, baItem,
    baMoneyTab: baTab(baMoney), baItemTab: baTab(baItem),
    baLent: ba ? baDir(ba.dir === "lent") : baDir(false), baBorrowed: ba ? baDir(ba.dir === "borrowed") : baDir(false),
    baWho: ba?.who || "", baAmount: ba?.amount || "", baItemVal: ba?.item || "", baDue: ba?.due || "",
    baDirLentLabel: ba?.type === "item" ? "I lent it out" : "I lent", baDirBorrowedLabel: ba?.type === "item" ? "I borrowed it" : "I borrowed",

    // invite
    inviteName: s.inviteFor?.name || g.name || "",
    inviteCode:
      s.inviteFor?.code || g.inviteCode || s.groupCodes[g.id] || "",
    inviteLink: inviteLinkForCode(
      s.inviteFor?.code || g.inviteCode || s.groupCodes[g.id] || "",
    ),

    // offline
    offline: s.offline,
    offlineLabel: s.offline ? "On — entries save to this device" : "Off — syncing live",
    offlineIcon: <Icon name="wallet" color={s.offline ? "#9A7B2E" : "#3F8E5B"} size={21} />,
    offlineTrackBg: s.offline ? "var(--chip-on-bg)" : "#DAD4C8", offlineKnobLeft: s.offline ? "21px" : "3px",
    inviteIcon: <Icon name="link" color="#3F8E5B" size={26} />,

    // notifications + search + dispute + edit
    notifications: s.notifications,
    unreadCount: s.notifications.filter((n) => !n.read).length,
    bellIcon: <Icon name="bell" color="var(--ink-soft)" size={22} />,
    goNotifications: a.goNotifications,
    markNotifRead: a.markNotifRead,
    markAllNotifRead: a.markAllNotifRead,
    search: s.search,
    setSearch: a.setSearch,
    flagDispute: a.flagDispute,
    resolveDispute: a.resolveDispute,
    editEntry: a.editEntry,

    // settings
    profileEmail, profileUsername,
    usernameDraft: s.usernameDraft, setUsernameDraft: a.setUsernameDraft, checkUsername: a.checkUsername, saveUsername: a.saveUsername,
    usernameStatus: s.usernameStatus, usernameStatusText, usernameStatusColor,
    notifPref: s.notifPref, toggleNotifPref: a.toggleNotifPref,
    notifTrackBg: s.notifPref ? "var(--chip-on-bg)" : "#DAD4C8", notifKnobLeft: s.notifPref ? "21px" : "3px",
    toggleOffline: a.toggleOffline,

    // invites surface
    myInviteRows, hasInvites: myInviteRows.length > 0,

    // audit
    auditRows, auditEmpty: auditRows.length === 0,

    toast: s.toast,
  };
}

// ---- React context --------------------------------------------------------

const TallyContext = createContext<ReturnType<typeof useTallyStore> | null>(null);

export function TallyProvider({
  children,
  userName,
  expenseHandlersRef,
  groupHandlersRef,
}: {
  children: React.ReactNode;
  userName?: string;
  expenseHandlersRef?: React.MutableRefObject<ExpenseHandlers | null>;
  groupHandlersRef?: React.MutableRefObject<GroupHandlers | null>;
}) {
  const store = useTallyStore(userName, { expenseHandlersRef, groupHandlersRef });
  return <TallyContext.Provider value={store}>{children}</TallyContext.Provider>;
}

export function useTally() {
  const ctx = useContext(TallyContext);
  if (!ctx) throw new Error("useTally must be used within TallyProvider");
  return ctx;
}

export type VM = ReturnType<typeof buildView>;
