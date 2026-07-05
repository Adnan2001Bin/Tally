// UI-layer types. Money math types live in @/lib/core.

export type Screen =
  | "home"
  | "spending"
  | "groups"
  | "group"
  | "settle"
  | "hub"
  | "borrow"
  | "meals"
  | "mealClose"
  | "create"
  | "entry"
  | "invite"
  | "notifications"
  | "settings"
  | "invites"
  | "audit";

export interface GroupMember {
  id: string;
  userId?: string;
  name: string;
  net: number; // positive = group owes them
  role?: "owner" | "admin" | "member";
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  description?: string | null;
  type?: string;
  inviteCode?: string;
  currency?: string;
  memberCount?: number;
  yourBalance?: number;
}

export type EntryKind = "personal" | "owed" | "share";

export interface EntryPart {
  name: string;
  owed: number;
}

export interface Entry {
  id: string;
  when: string;
  time?: string;
  title: string;
  sub: string;
  cat: string;
  amount: number;
  kind: EntryKind;
  note?: string;
  fresh?: boolean;
  /** ISO timestamp — used for charts when synced from the API. */
  at?: string;
  // shared-only
  total?: number;
  paidBy?: string;
  group?: string;
  parts?: EntryPart[];
  yourShare?: number;
}

export interface Loan {
  id: string;
  who: string;
  dir: "lent" | "borrowed";
  amount: number;
  note: string;
  due: string | null;
}

export interface Thing {
  id: string;
  what: string;
  who: string;
  dir: "lent" | "borrowed";
  since: string;
}

export interface MealMember {
  name: string;
  contributed: number;
  meals: number;
}

export interface Draft {
  title: string;
  total: number;
  payer: string;
  parts: string[];
  allMembers: string[];
  method: "equal" | "exact";
  cat: string;
  group: string | null;
  isShared: boolean;
  unresolved: string[];
  owed: Record<string, number>;
}

export interface Capture {
  stage: "input" | "draft";
  mode: "say" | "manual";
  text: string;
  amount: string;
  draft: Draft | null;
  prefill?: { title: string; cat: string };
}

export type NotifKind = "expense" | "settle" | "dispute" | "group" | "join";

export interface Notification {
  id: string;
  text: string;
  when: string;
  read: boolean;
  kind: NotifKind;
}

export interface BorrowAdd {
  type: "money" | "item";
  dir: "lent" | "borrowed";
  who: string;
  amount: string;
  item: string;
  due: string;
}

export interface TallyState {
  screen: Screen;
  activeGroup: string;
  capture: Capture | null;
  toast: string | null;
  paid: Record<string, boolean>;
  extraEntries: Entry[];
  /** Personal expenses loaded from the API. */
  apiPersonalEntries: Entry[];
  /** Shared group expenses loaded from the API. */
  apiGroupEntries: Entry[];
  returned: Record<string, boolean>;
  cleared: Record<string, boolean>;
  mealMembers: MealMember[];
  newGroupName: string;
  newGroupMembers: string[];
  joinCode: string;
  createTab: "start" | "join";
  borrowAdd: BorrowAdd | null;
  inviteFor: { name: string; code: string } | null;
  offline: boolean;
  entry: Entry | null;
  lastScreen: Screen;
  // user-created entries live in state until group/shared APIs are wired
  groups: Group[];
  loans: Loan[];
  things: Thing[];
  // social / QoL
  notifications: Notification[];
  disputed: Record<string, boolean>; // entry id → disputed
  groupCodes: Record<string, string>; // group id → invite code
  search: string; // home feed filter
  displayName: string | null; // greeting override (signed-in UI)

  // ---- profile + settings ----
  profile: ProfileVM | null;
  usernameDraft: string;
  usernameStatus: "idle" | "checking" | "available" | "taken";
  notifPref: boolean; // placeholder notifications preference

  // ---- monthly budget ----
  monthlyBudget: number | null;
  editingMonthlyBudget: boolean;
  monthlyBudgetDraft: string;

  // ---- username invites (subject to acceptance) ----
  inviteUsername: string; // input on the Create screen
  groupInvites: Record<string, PendingInviteVM[]>; // groupId → invites this group has sent
  myInvites: PendingInviteVM[]; // invites the current user has received

  // ---- audit ----
  audit: AuditEventVM[]; // timeline for the active group
}

export interface ProfileVM {
  userId: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
}

export interface PendingInviteVM {
  id: string;
  groupId: string;
  groupName: string;
  username: string;
  invitedBy: string;
  when: string;
}

export interface AuditEventVM {
  id: string;
  // loose string to match the backend's audit taxonomy (expense | settlement |
  // correction | dispute | meal | membership | invite); the UI labels/dots fall
  // back gracefully on unknown kinds.
  kind: string;
  when: string;
  summary: string;
  actor?: string;
  before?: string;
  after?: string;
}
