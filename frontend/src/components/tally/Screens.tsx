import React from "react";
import { useTally } from "@/lib/tally/store";
import { useAuth } from "@/lib/tally/auth-bridge";
import { useTheme } from "@/lib/tally/theme";
import { getProfileErrorMessage, useUpdateProfileMutation } from "@/lib/hooks/use-profile";
import { Icon } from "@/lib/tally/icons";
import { BackLink, ScreenScroll, SectionLabel, serif } from "./ui";

// ============ HOME ============
export function Home() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 26px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ ...serif, fontSize: 34, lineHeight: 1.05 }}>Hi, {vm.userName}</div>
          <div style={{ ...serif, fontStyle: "italic", fontSize: 17, color: "var(--muted)", marginTop: 2 }}>{vm.homeMood}</div>
        </div>
        <div data-testid="nav-notifications" onClick={vm.goNotifications} style={{ position: "relative", padding: 6, cursor: "pointer", marginTop: 4 }}>
          {vm.bellIcon}
          {vm.unreadCount > 0 && (
            <span data-testid="notif-badge" style={{ position: "absolute", top: 0, right: 0, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "#C2693E", color: "var(--surface-card)", font: "600 10px var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center" }}>{vm.unreadCount}</span>
          )}
        </div>
      </div>
      <div style={{ padding: "10px 26px 2px" }}>
        <input data-testid="home-search" value={vm.search} onChange={(e) => vm.setSearch(e.target.value)} placeholder="Search your spending…" style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", font: "500 14px var(--font-sans)", color: "var(--ink)", background: "var(--surface-card)", outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 11, padding: "12px 26px 8px" }}>
        <div data-testid="home-owed" onClick={vm.goGroups} style={{ flex: 1, background: "#EAF1EC", borderRadius: 18, padding: "15px 16px", cursor: "pointer" }}>
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".08em", color: "#3F8E5B" }}>OWED TO YOU</div>
          <div style={{ ...serif, fontSize: 34, color: "#3F8E5B", lineHeight: 1.1, marginTop: 4 }}>{vm.owedText}</div>
        </div>
        <div data-testid="home-owe" onClick={vm.goGroups} style={{ flex: 1, background: "#F6EBE4", borderRadius: 18, padding: "15px 16px", cursor: "pointer" }}>
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".08em", color: "#C2693E" }}>YOU OWE</div>
          <div style={{ ...serif, fontSize: 34, color: "#C2693E", lineHeight: 1.1, marginTop: 4 }}>{vm.oweText}</div>
        </div>
      </div>
      {vm.streamSections.length === 0 && (
        <div style={{ padding: "40px 26px", textAlign: "center", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5 }}>
          {vm.search.trim()
            ? <>Nothing matches “{vm.search}”.<br />Try a different word.</>
            : <>Nothing here yet.<br />Tap <b style={{ color: "#C2693E" }}>+</b> to add your first expense.</>}
        </div>
      )}
      {vm.streamSections.map((sec) => (
        <div key={sec.label}>
          <SectionLabel>{sec.label}</SectionLabel>
          {sec.items.map((it) => (
            <div key={it.id} data-testid={`entry-${it.id}`} onClick={it.open} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 26px", animation: it.anim, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: it.iconBg }}>{it.iconEl}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{ font: "600 15px var(--font-sans)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</span>
                    {it.disputed && <span style={{ font: "600 9.5px var(--font-sans)", letterSpacing: ".04em", color: "#C2693E", background: "#F6EBE4", borderRadius: 999, padding: "2px 7px", flexShrink: 0 }}>DISPUTED</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.sub}</div>
                </div>
              </div>
              <div style={{ font: "600 15px var(--font-sans)", flexShrink: 0, marginLeft: 10, color: it.amountColor }}>{it.amountText}</div>
            </div>
          ))}
        </div>
      ))}
    </ScreenScroll>
  );
}

// ============ SPENDING ============
export function Spending() {
  const { vm, actions } = useTally();
  const updateProfile = useUpdateProfileMutation();

  const saveMonthlyBudget = () => {
    const amt = parseFloat(vm.monthlyBudgetDraft || "0") || 0;
    if (!amt) {
      actions.flash("Enter how much you have this month");
      return;
    }
    updateProfile.mutate(
      { monthly_budget: amt },
      {
        onSuccess: (data) => {
          actions.syncMonthlyBudget(data.user.monthly_budget ?? amt);
          actions.closeMonthlyBudgetEdit();
          actions.flash("Monthly amount saved");
        },
        onError: (error) => actions.flash(getProfileErrorMessage(error)),
      },
    );
  };

  const clearMonthlyBudget = () => {
    updateProfile.mutate(
      { monthly_budget: null },
      {
        onSuccess: () => {
          actions.clearMonthlyBudget();
          actions.flash("Monthly amount cleared");
        },
        onError: (error) => actions.flash(getProfileErrorMessage(error)),
      },
    );
  };

  return (
    <ScreenScroll>
      <div style={{ padding: "16px 26px 20px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...serif, fontSize: 30 }}>Your spending</span>
          <span style={{ font: "600 13px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "6px 13px" }}>{vm.monthLabel} ▾</span>
        </div>
        <div style={{ ...serif, fontSize: 62, lineHeight: 1.02, marginTop: 16 }}>
          <span style={{ fontSize: 30, color: "var(--muted)" }}>৳</span>{vm.spendTotalText}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
          spent this month
          {vm.spendShared > 0 && (
            <> · <span style={{ color: "#C2693E" }}>incl. {vm.spendSharedText} from shared</span></>
          )}
        </div>

        {/* Monthly budget */}
        <div style={{ marginTop: 20, background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px" }}>
          {vm.editingMonthlyBudget ? (
            <>
              <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>
                How much do you have this month?
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ font: "600 16px var(--font-sans)", color: "var(--muted)" }}>৳</span>
                <input
                  data-testid="monthly-budget-input"
                  value={vm.monthlyBudgetDraft}
                  onChange={(e) => vm.setMonthlyBudgetDraft(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 50000"
                  style={{ flex: 1, border: "1px solid var(--line-strong)", borderRadius: 12, padding: "12px 14px", font: "600 18px var(--font-sans)", color: "var(--ink)", background: "var(--surface)", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <div
                  data-testid="monthly-budget-save"
                  onClick={saveMonthlyBudget}
                  style={{ flex: 1, textAlign: "center", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 12, padding: 12, font: "600 14px var(--font-sans)", cursor: "pointer" }}
                >
                  Save
                </div>
                <div
                  onClick={vm.closeMonthlyBudgetEdit}
                  style={{ flex: 1, textAlign: "center", background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink-soft)", borderRadius: 12, padding: 12, font: "600 14px var(--font-sans)", cursor: "pointer" }}
                >
                  Cancel
                </div>
              </div>
            </>
          ) : vm.hasMonthlyBudget ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ font: "600 13px var(--font-sans)", color: "var(--ink-soft)" }}>
                  of {vm.monthlyBudgetText} this month
                </div>
                <span
                  data-testid="monthly-budget-edit"
                  onClick={vm.openMonthlyBudgetEdit}
                  style={{ font: "600 13px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}
                >
                  Edit
                </span>
              </div>
              <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: vm.budgetUsedPct, background: vm.budgetBarColor, borderRadius: 99 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, color: "var(--muted)" }}>
                <span>{vm.budgetUsedPct} used</span>
                <span style={{ color: vm.budgetOver ? "#C2693E" : "#3F8E5B" }}>
                  {vm.budgetOver ? "Over budget" : `${vm.budgetRemainingText} left`}
                </span>
              </div>
            </>
          ) : (
            <div
              data-testid="monthly-budget-set"
              onClick={vm.openMonthlyBudgetEdit}
              style={{ textAlign: "center", padding: "4px 0", cursor: "pointer" }}
            >
              <div style={{ font: "600 14px var(--font-sans)", color: "#C2693E" }}>+ Set your monthly amount</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>How much money you have for this month</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 56, marginTop: 24 }}>
          {vm.weeks.map((w, i) => (<div key={i} style={{ flex: 1, borderRadius: 5, height: w.h, background: w.bg }} />))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-2)", marginTop: 7 }}>
          <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
        </div>
      </div>
      {vm.spendEmpty && (
        <div style={{ padding: "40px 26px", textAlign: "center", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5 }}>
          No spending recorded this month.<br />Tap <b style={{ color: "#C2693E" }}>+</b> to add your first expense.
        </div>
      )}
      {vm.spendCats.map((c) => (
        <div key={c.name} style={{ padding: "14px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
              <span style={{ font: "600 15px var(--font-sans)" }}>{c.name}</span>
            </div>
            <div style={{ font: "600 15px var(--font-sans)" }}>{c.amountText}</div>
          </div>
          <div style={{ height: 6, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: c.pct, background: c.color }} />
          </div>
        </div>
      ))}
    </ScreenScroll>
  );
}

// ============ GROUPS ============
export function Groups() {
  const { vm } = useTally();
  const empty = vm.groupCards.length === 0;

  return (
    <ScreenScroll>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 26px 14px" }}>
        <span style={{ ...serif, fontSize: 30 }}>Groups</span>
        <span data-testid="groups-new" onClick={vm.goCreate} style={{ font: "600 14px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>+ New</span>
      </div>
      {empty ? (
        <div
          data-testid="groups-empty"
          style={{
            margin: "12px 22px 28px",
            padding: "36px 28px 32px",
            background: "var(--surface-card)",
            border: "1px solid var(--line)",
            borderRadius: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              margin: "0 auto 22px",
              background: "#F6EBE4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="groups" color="#C2693E" size={34} />
          </div>
          <div style={{ ...serif, fontSize: 28, lineHeight: 1.1, color: "var(--ink)" }}>No groups yet</div>
          <div
            style={{
              fontSize: 14.5,
              color: "var(--muted)",
              marginTop: 10,
              lineHeight: 1.55,
              maxWidth: 280,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Trips, roommates, office lunches — create a group to split expenses and see who owes what.
          </div>
          <div
            data-testid="groups-empty-create"
            onClick={vm.goCreate}
            style={{
              marginTop: 26,
              background: "var(--chip-on-bg)",
              color: "var(--chip-on-fg)",
              borderRadius: 16,
              padding: "16px 20px",
              font: "600 16px var(--font-sans)",
              cursor: "pointer",
            }}
          >
            Create your first group
          </div>
          <div
            data-testid="groups-empty-join"
            onClick={() => {
              vm.goCreate();
              vm.setJoinTab();
            }}
            style={{
              marginTop: 12,
              font: "600 15px var(--font-sans)",
              color: "#C2693E",
              cursor: "pointer",
            }}
          >
            Join with an invite code
          </div>
        </div>
      ) : (
        vm.groupCards.map((g) => (
          <div key={g.id} data-testid={`group-card-${g.id}`} onClick={g.open} style={{ margin: "0 22px 14px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 20, padding: 18, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ ...serif, fontSize: 26, lineHeight: 1.05 }}>{g.name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{g.members}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".06em", color: g.color }}>{g.label}</div>
                <div style={{ ...serif, fontSize: 30, lineHeight: 1.1, color: g.color }}>{g.amountText}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </ScreenScroll>
  );
}

// ============ GROUP DETAIL ============
export function GroupDetail() {
  const { vm, actions } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BackLink label="‹ Groups" onClick={vm.goGroups} testid="group-back" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span data-testid="group-share-invite" onClick={actions.openGroupInvite} style={{ font: "600 14px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>Share</span>
          <span data-testid="group-history" onClick={vm.goAudit} style={{ font: "600 14px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>History</span>
          <span data-testid="group-add-expense" onClick={() => actions.openGroupExpense()} style={{ font: "600 14px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>+ Add expense</span>
        </div>
      </div>
      <div style={{ padding: "12px 26px 20px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...serif, fontSize: 36, lineHeight: 1.05 }}>{vm.groupName}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{vm.groupMembers}</div>
        <div style={{ ...serif, fontSize: 17, color: "var(--ink-soft)", marginTop: 20 }}>{vm.groupStandingLabel}</div>
        <div style={{ ...serif, fontSize: 52, lineHeight: 1, marginTop: 2, color: vm.groupStandingColor }}>{vm.groupStandingText}</div>
      </div>
      {vm.canManageJoinRequests && (
        <>
          <SectionLabel>Join requests</SectionLabel>
          <div style={{ padding: "0 22px 8px", fontSize: 12.5, color: "var(--muted-2)", lineHeight: 1.5 }}>
            People who used your invite link and are waiting for approval.
          </div>
          {vm.joinRequestRows.length === 0 ? (
            <div data-testid="join-requests-empty" style={{ margin: "0 22px 12px", padding: "18px 16px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 16, fontSize: 14, color: "var(--muted-2)", textAlign: "center" }}>
              No pending requests
            </div>
          ) : (
            vm.joinRequestRows.map((req) => (
              <div key={req.id} data-testid={`join-request-${req.id}`} style={{ margin: "0 22px 12px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ font: "600 16px var(--font-sans)" }}>{req.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>@{req.username} · {req.when}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <div data-testid={`join-request-accept-${req.id}`} onClick={req.accept} style={{ flex: 1, textAlign: "center", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 13, padding: 12, font: "600 14px var(--font-sans)", cursor: "pointer" }}>Accept</div>
                  <div data-testid={`join-request-decline-${req.id}`} onClick={req.reject} style={{ flex: 1, textAlign: "center", background: "var(--surface-card)", border: "1px solid var(--line-strong)", color: "var(--ink-soft)", borderRadius: 13, padding: 12, font: "600 14px var(--font-sans)", cursor: "pointer" }}>Decline</div>
                </div>
              </div>
            ))
          )}
        </>
      )}
      <SectionLabel>Who&apos;s who</SectionLabel>
      {vm.groupBalances.map((b) => (
        <div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 15px var(--font-sans)", background: b.avBg, color: b.avColor }}>{b.initial}</span>
            <div>
              <div style={{ font: "600 15px var(--font-sans)" }}>{b.name}</div>
              <div style={{ fontSize: 12.5, color: b.color }}>{b.relation}</div>
            </div>
          </div>
          <div style={{ font: "600 16px var(--font-sans)", color: b.color }}>{b.amountText}</div>
        </div>
      ))}
      <div style={{ padding: "18px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div data-testid="group-add-expense-btn" onClick={() => actions.openGroupExpense()} style={{ background: "#C2693E", color: "#fff", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Add expense</div>
        <div data-testid="group-settle-up" onClick={vm.goSettle} style={{ background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Settle up</div>
      </div>
      {vm.groupHasActivity && (
        <>
          <SectionLabel style={{ padding: "24px 26px 4px" }}>Recent activity</SectionLabel>
          {vm.groupActivity.map((aItem, i) => (
            <div key={i} onClick={aItem.open} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 26px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: aItem.iconBg }}>{aItem.iconEl}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "600 15px var(--font-sans)" }}>{aItem.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{aItem.sub}</div>
                </div>
              </div>
              <div style={{ font: "600 15px var(--font-sans)", flexShrink: 0, marginLeft: 10, color: aItem.amountColor }}>{aItem.amountText}</div>
            </div>
          ))}
        </>
      )}
    </ScreenScroll>
  );
}

// ============ SETTLE UP ============
export function Settle() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}>
        <BackLink label={`‹ ${vm.groupName}`} onClick={vm.goGroup} />
      </div>
      <div style={{ padding: "12px 26px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...serif, fontSize: 36, lineHeight: 1.05 }}>Settle up</div>
        <div style={{ ...serif, fontStyle: "italic", fontSize: 16, color: "var(--muted)", marginTop: 2 }}>{vm.settleSummary}</div>
      </div>
      <div style={{ padding: "16px 22px 0" }}>
        {vm.settleTx.map((t, i) => (
          <div key={i} style={{ background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: 18, marginBottom: 13, animation: t.anim }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px var(--font-sans)", background: t.avBg, color: t.avColor }}>{t.initial}</span>
              <div style={{ fontSize: 15, lineHeight: 1.4 }}>{t.line}</div>
              <div style={{ marginLeft: "auto", ...serif, fontSize: 26, color: t.color }}>{t.amountText}</div>
            </div>
            <div data-testid={`settle-mark-${i}`} onClick={t.mark} style={{ marginTop: 14, textAlign: "center", borderRadius: 12, padding: 11, font: "600 14px var(--font-sans)", cursor: "pointer", background: t.btnBg, color: t.btnColor, border: `1px solid ${t.btnBorder}` }}>{t.btnText}</div>
            {t.showPay && (
              <div onClick={t.pay} style={{ marginTop: 9, textAlign: "center", font: "600 13px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>or open your payment app ↗</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 26px 0", fontSize: 12, color: "var(--muted-2)", textAlign: "center", lineHeight: 1.5 }}>
        Marking paid only records it here.<br />No real money moves through Tally.
      </div>
    </ScreenScroll>
  );
}

// A reusable hub-style navigation row (card with icon, title, sub, chevron).
function HubRow({ testid, icon, title, sub, badge, onClick }: { testid: string; icon: React.ReactNode; title: string; sub: string; badge?: number; onClick: () => void }) {
  return (
    <div data-testid={testid} onClick={onClick} style={{ margin: "0 22px 13px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: 18, display: "flex", alignItems: "center", gap: 15, cursor: "pointer" }}>
      <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--surface-sand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 16px var(--font-sans)" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
      </div>
      {badge ? <span data-testid={`${testid}-badge`} style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "#C2693E", color: "#fff", font: "600 11px var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}>{badge}</span> : null}
      <span style={{ color: "#C9C2B6", fontSize: 22 }}>›</span>
    </div>
  );
}

// ============ MORE / HUB ============
export function Hub() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "16px 26px 16px" }}><span style={{ ...serif, fontSize: 30 }}>More</span></div>
      {vm.hubItems.map((h) => (
        <HubRow key={h.key} testid={`hub-${h.key}`} icon={h.iconEl} title={h.title} sub={h.sub} onClick={h.go} />
      ))}
      <SectionLabel style={{ padding: "14px 26px 8px" }}>You</SectionLabel>
      <HubRow testid="hub-invites" icon={<Icon name="user" color="var(--ink)" size={21} />} title="Invites" sub="Invitations to join a group" badge={vm.myInviteRows.length} onClick={vm.goInvites} />
      <HubRow testid="hub-settings" icon={<Icon name="grid" color="var(--ink)" size={21} />} title="Settings" sub="Profile, appearance, offline, sign out" onClick={vm.goSettings} />
    </ScreenScroll>
  );
}

// A standard settings toggle row (track + knob).
function ToggleRow({ testid, icon, title, sub, on, trackBg, knobLeft, onClick }: { testid: string; icon?: React.ReactNode; title: string; sub: string; on: boolean; trackBg: string; knobLeft: string; onClick: () => void }) {
  return (
    <div style={{ margin: "0 22px 12px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      {icon && <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--surface-sand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 15px var(--font-sans)" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
      </div>
      <div data-testid={testid} onClick={onClick} aria-pressed={on} style={{ width: 46, height: 28, borderRadius: 999, background: trackBg, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 3, left: knobLeft, width: 22, height: 22, borderRadius: "50%", background: "var(--surface-card)", boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "left .2s" }} />
      </div>
    </div>
  );
}

// ============ SETTINGS ============
export function Settings() {
  const { vm } = useTally();
  const auth = useAuth();
  const theme = useTheme();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ More" onClick={vm.goHub} testid="settings-back" /></div>
      <div style={{ padding: "12px 26px 14px" }}><div style={{ ...serif, fontSize: 34 }}>Settings</div></div>

      {/* Profile */}
      <SectionLabel>Profile</SectionLabel>
      <div style={{ margin: "0 22px 12px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: "16px 18px" }}>
        {vm.profileEmail && <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Signed in as <b style={{ color: "var(--ink-soft)" }}>{vm.profileEmail}</b></div>}
        <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>Your username</div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <input
            data-testid="settings-username"
            value={vm.usernameDraft}
            onChange={(e) => vm.setUsernameDraft(e.target.value)}
            onBlur={vm.checkUsername}
            placeholder="pick a handle, e.g. atlas"
            style={{ flex: 1, border: "1px solid var(--line-strong)", borderRadius: 13, padding: 13, font: "500 15px var(--font-sans)", color: "var(--ink)", background: "var(--surface)", outline: "none" }}
          />
          <div data-testid="settings-username-save" onClick={vm.saveUsername} style={{ background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 13, padding: "13px 16px", font: "600 14px var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>Save</div>
        </div>
        {vm.usernameStatusText && <div data-testid="settings-username-status" style={{ fontSize: 12.5, color: vm.usernameStatusColor, marginTop: 8 }}>{vm.usernameStatusText}</div>}
        <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 8, lineHeight: 1.5 }}>People invite you to a group by your username.</div>
      </div>

      {/* Appearance */}
      <SectionLabel>Appearance</SectionLabel>
      <ToggleRow
        testid="theme-toggle"
        icon={<Icon name="wallet" color={theme.isDark ? "#C9A24B" : "var(--ink)"} size={21} />}
        title="Dark mode"
        sub={theme.isDark ? "On — easy on the eyes at night" : "Off — following a light, warm look"}
        on={theme.isDark}
        trackBg={theme.isDark ? "var(--chip-on-bg)" : "#DAD4C8"}
        knobLeft={theme.isDark ? "21px" : "3px"}
        onClick={theme.toggle}
      />

      {/* Offline */}
      <SectionLabel>Offline mode</SectionLabel>
      <ToggleRow
        testid="offline-toggle"
        icon={vm.offlineIcon}
        title="Save here, sync later"
        sub={vm.offlineLabel}
        on={vm.offline}
        trackBg={vm.offlineTrackBg}
        knobLeft={vm.offlineKnobLeft}
        onClick={vm.toggleOffline}
      />

      {/* Notifications */}
      <SectionLabel>Notifications</SectionLabel>
      <ToggleRow
        testid="notif-pref-toggle"
        icon={<Icon name="bell" color="var(--ink)" size={21} />}
        title="Activity alerts"
        sub={vm.notifPref ? "On — tell me about new shared expenses" : "Off — I'll check the app myself"}
        on={vm.notifPref}
        trackBg={vm.notifTrackBg}
        knobLeft={vm.notifKnobLeft}
        onClick={vm.toggleNotifPref}
      />

      {/* Sign out */}
      <div style={{ padding: "14px 22px 0" }}>
        <div
          data-testid="sign-out"
          onClick={() => { if (typeof window === "undefined" || window.confirm("Sign out of Tally?")) auth.signOut(); }}
          style={{ textAlign: "center", border: "1px solid var(--line-strong)", borderRadius: 16, padding: 15, font: "600 15px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}
        >
          Sign out
        </div>
      </div>
    </ScreenScroll>
  );
}

// ============ INVITES (received) ============
export function Invites() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ More" onClick={vm.goHub} testid="invites-back" /></div>
      <div style={{ padding: "12px 26px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...serif, fontSize: 34 }}>Invites</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Groups that want you to join</div>
      </div>
      {!vm.hasInvites && (
        <div data-testid="invites-empty" style={{ padding: "48px 30px", textAlign: "center", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5 }}>
          No invites right now.<br />When someone invites you by username, it shows up here.
        </div>
      )}
      {vm.myInviteRows.map((inv) => (
        <div key={inv.id} data-testid={`invite-${inv.id}`} style={{ margin: "14px 22px 0", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
          <div style={{ ...serif, fontSize: 22, lineHeight: 1.1 }}>{inv.groupName}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{inv.byLine} · {inv.when}</div>
          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <div data-testid={`invite-accept-${inv.id}`} onClick={inv.accept} style={{ flex: 1, textAlign: "center", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 13, padding: 12, font: "600 14px var(--font-sans)", cursor: "pointer" }}>Join</div>
            <div data-testid={`invite-decline-${inv.id}`} onClick={inv.decline} style={{ flex: 1, textAlign: "center", background: "var(--surface-card)", border: "1px solid var(--line-strong)", color: "var(--ink-soft)", borderRadius: 13, padding: 12, font: "600 14px var(--font-sans)", cursor: "pointer" }}>No thanks</div>
          </div>
        </div>
      ))}
    </ScreenScroll>
  );
}

// ============ AUDIT (what changed, how) ============
export function Audit() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label={`‹ ${vm.groupName}`} onClick={vm.goGroup} testid="audit-back" /></div>
      <div style={{ padding: "12px 26px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...serif, fontSize: 34 }}>History</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Everything that happened in {vm.groupName}, newest first</div>
      </div>
      {vm.auditEmpty && (
        <div data-testid="audit-empty" style={{ padding: "48px 30px", textAlign: "center", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5 }}>
          Nothing has happened here yet.<br />Add an expense or settle up and you&apos;ll see it tracked here.
        </div>
      )}
      {vm.auditRows.map((ev) => (
        <div key={ev.id} data-testid={`audit-${ev.id}`} style={{ display: "flex", gap: 13, padding: "14px 26px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: ev.dot, marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 14px var(--font-sans)", lineHeight: 1.4 }}>
              <span style={{ color: "var(--muted)" }}>{ev.kindLabel} · </span>{ev.summary}
            </div>
            {ev.hasChange && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                {ev.before && <span style={{ textDecoration: "line-through" }}>{ev.before}</span>}
                {ev.before && ev.after && <span> → </span>}
                {ev.after && <b style={{ color: "var(--ink-soft)" }}>{ev.after}</b>}
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 3 }}>{ev.when}</div>
          </div>
        </div>
      ))}
    </ScreenScroll>
  );
}

// ============ NOTIFICATIONS ============
export function Notifications() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ Home" onClick={vm.goHome} /></div>
      <div style={{ padding: "12px 26px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
        <span style={{ ...serif, fontSize: 30 }}>Activity</span>
        {vm.notifications.length > 0 && (
          <span data-testid="notif-mark-all" onClick={vm.markAllNotifRead} style={{ font: "600 13px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>Mark all read</span>
        )}
      </div>
      {vm.notifications.length === 0 && (
        <div style={{ padding: "48px 30px", textAlign: "center", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5 }}>
          No activity yet.<br />Add a group expense or settle up — you’ll see it here.
        </div>
      )}
      {vm.notifications.map((n) => (
        <div key={n.id} data-testid={`notif-item-${n.id}`} onClick={() => vm.markNotifRead(n.id)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 26px", cursor: "pointer", background: n.read ? "transparent" : "var(--surface-sunken)" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: n.read ? "transparent" : "#C2693E", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 14px var(--font-sans)", lineHeight: 1.4 }}>{n.text}</div>
            <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{n.when}</div>
          </div>
        </div>
      ))}
    </ScreenScroll>
  );
}

// ============ BORROW ============
export function Borrow() {
  const { vm, actions } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ More" onClick={vm.goHub} /></div>
      <div style={{ padding: "12px 26px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...serif, fontSize: 34 }}>Borrow</div>
        <span data-testid="borrow-add" onClick={actions.openBorrowAdd} style={{ font: "600 14px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>+ Add</span>
      </div>
      <SectionLabel style={{ padding: "14px 26px 8px" }}>Money · settles like a debt</SectionLabel>
      {vm.loanRows.map((l) => (
        <div key={l.id} style={{ margin: "0 22px 12px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 18, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 15px var(--font-sans)", background: l.avBg, color: l.avColor, flexShrink: 0 }}>{l.initial}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 15px var(--font-sans)", textDecoration: l.strike }}>{l.line}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{l.note} · {l.due}</div>
            </div>
            <div style={{ ...serif, fontSize: 26, color: l.color, textDecoration: l.strike }}>{l.amountText}</div>
          </div>
          <div data-testid={`loan-mark-${l.id}`} onClick={l.mark} style={{ marginTop: 13, textAlign: "center", border: "1px solid var(--line-strong)", borderRadius: 12, padding: 10, font: "600 13px var(--font-sans)", color: "var(--ink-soft)", cursor: "pointer" }}>{l.btnText}</div>
        </div>
      ))}
      <SectionLabel style={{ padding: "20px 26px 8px" }}>Things · just a return reminder</SectionLabel>
      {vm.thingRows.map((t) => (
        <div key={t.id} style={{ margin: "0 22px 10px", background: "var(--surface-sunken)", border: "1px dashed var(--line-strong)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, opacity: t.opacity }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--surface-card)", border: "1px solid var(--line-strong)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>▢</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 15px var(--font-sans)", textDecoration: t.strike }}>{t.what}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{t.line} · {t.since}</div>
          </div>
          <div data-testid={`thing-mark-${t.id}`} onClick={t.mark} style={{ font: "600 12px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "8px 13px", cursor: "pointer", whiteSpace: "nowrap" }}>{t.btnText}</div>
        </div>
      ))}
    </ScreenScroll>
  );
}

// ============ MEALS ============
export function Meals() {
  const { vm } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ More" onClick={vm.goHub} /></div>
      <div style={{ padding: "12px 26px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...serif, fontSize: 30, lineHeight: 1.05 }}>Shared fridge</div>
        <div data-testid="meal-group-name" style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{vm.mealGroupName || "your group"}</div>
        <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", marginTop: 18 }}>Cost per meal right now</div>
        <div data-testid="meal-cpm" style={{ ...serif, fontSize: 60, lineHeight: 1.02, marginTop: 2 }}>{vm.mealCpmText}</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{vm.mealTotalMeals} meals · {vm.mealTotalFood} in groceries this cycle</div>
        {vm.mealHasMe && (
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <div data-testid="meal-log-me" onClick={vm.logMealMe} style={{ flex: 1, textAlign: "center", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 14, padding: 13, font: "600 14px var(--font-sans)", cursor: "pointer" }}>+ I ate a meal</div>
            <div data-testid="meal-add-groc-me" onClick={vm.addGrocMe} style={{ flex: 1, textAlign: "center", background: "var(--surface-card)", border: "1px solid var(--line-strong)", color: "var(--ink-soft)", borderRadius: 14, padding: 13, font: "600 14px var(--font-sans)", cursor: "pointer" }}>+ ৳200 groceries</div>
          </div>
        )}
      </div>
      {vm.mealEmpty ? (
        <div data-testid="meals-empty" style={{ padding: "48px 30px", textAlign: "center", color: "var(--muted-2)", fontSize: 14, lineHeight: 1.5 }}>
          No shared meals tracked yet.<br />Pick a group and start logging who ate.
        </div>
      ) : (
        <>
      <div data-testid="meal-regular-hint" style={{ padding: "14px 26px 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{vm.mealRegularHint}</div>
      <SectionLabel style={{ padding: "12px 26px 4px" }}>Members</SectionLabel>
      {vm.mealRows.map((m) => (
        <div key={m.key} data-testid={`meal-member-${m.key}`} style={{ padding: "10px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px var(--font-sans)", background: m.avBg, color: m.avColor, flexShrink: 0 }}>{m.initial}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 14px var(--font-sans)" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.meals} · paid {m.contributed}</div>
            </div>
            <span onClick={m.logMeal} style={{ font: "600 12px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>+meal</span>
            <span onClick={m.addG} style={{ font: "600 12px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>+৳</span>
            <div style={{ font: "600 14px var(--font-sans)", color: m.balanceColor, width: 58, textAlign: "right", flexShrink: 0 }}>{m.balanceText}</div>
          </div>
          {m.canToggleRegular && (
            <div data-testid={`meal-regular-${m.key}`} onClick={m.toggleRegular} style={{ marginLeft: 47, marginTop: 6, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <span style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${m.regular ? "#3F8E5B" : "var(--line-strong)"}`, background: m.regular ? "#3F8E5B" : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{m.regular ? "✓" : ""}</span>
              <span style={{ font: "600 12px var(--font-sans)", color: m.regular ? "#3F8E5B" : "var(--muted)" }}>Regular — counted in automatically</span>
            </div>
          )}
        </div>
      ))}
      <SectionLabel style={{ padding: "20px 26px 8px" }}>If you closed the cycle today</SectionLabel>
      {vm.mealSettle.map((t, i) => (
        <div key={i} style={{ margin: "0 22px 10px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px var(--font-sans)", background: t.avBg, color: t.avColor }}>{t.initial}</span>
          <div style={{ flex: 1, fontSize: 14 }}>{t.line}</div>
          <div style={{ ...serif, fontSize: 22, color: t.color }}>{t.amountText}</div>
        </div>
      ))}
      <div style={{ padding: "8px 22px 0" }}>
        <div data-testid="meal-close-cycle" onClick={vm.goMealClose} style={{ textAlign: "center", background: vm.accent, color: "#fff", borderRadius: 16, padding: 16, font: "600 15px var(--font-sans)", cursor: "pointer" }}>Close cycle &amp; settle</div>
      </div>
      <div style={{ padding: "10px 30px 0", fontSize: 12, color: "var(--muted-2)", textAlign: "center", lineHeight: 1.5 }}>Fairness here is good enough, not surgical — meals are counted, not weighed.</div>
        </>
      )}
    </ScreenScroll>
  );
}

// ============ MEAL CLOSE ============
export function MealClose() {
  const { vm, actions } = useTally();
  return (
    <ScreenScroll pad="8px 0 40px">
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ Shared fridge" onClick={vm.goMeals} /></div>
      <div style={{ padding: "12px 26px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...serif, fontSize: 34, lineHeight: 1.05 }}>Close the cycle</div>
        <div style={{ ...serif, fontStyle: "italic", fontSize: 16, color: "var(--muted)", marginTop: 2 }}>Final meal rate · {vm.mcCpmText} a meal</div>
      </div>
      <SectionLabel>Where everyone landed</SectionLabel>
      {vm.mealRows.map((m) => (
        <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 13, padding: "9px 26px" }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px var(--font-sans)", background: m.avBg, color: m.avColor }}>{m.initial}</span>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 14px var(--font-sans)" }}>{m.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.meals} · paid {m.contributed}</div>
          </div>
          <div style={{ font: "600 14px var(--font-sans)", color: m.balanceColor }}>{m.balanceText}</div>
        </div>
      ))}
      <SectionLabel style={{ padding: "20px 26px 8px" }}>Settle to zero</SectionLabel>
      {vm.mealSettle.map((t, i) => (
        <div key={i} style={{ margin: "0 22px 10px", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px var(--font-sans)", background: t.avBg, color: t.avColor }}>{t.initial}</span>
          <div style={{ flex: 1, fontSize: 14 }}>{t.line}</div>
          <div style={{ ...serif, fontSize: 22, color: t.color }}>{t.amountText}</div>
        </div>
      ))}
      <div style={{ padding: "10px 22px 0" }}>
        <div data-testid="meal-confirm-close" onClick={actions.confirmMealClose} style={{ textAlign: "center", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Confirm &amp; start fresh cycle</div>
      </div>
      <div style={{ padding: "12px 30px 0", fontSize: 12, color: "var(--muted-2)", textAlign: "center", lineHeight: 1.5 }}>These transfers post to settle-up. Nothing moves through Tally.</div>
    </ScreenScroll>
  );
}

// ============ CREATE / JOIN ============
export function Create() {
  const { vm, actions } = useTally();
  return (
    <ScreenScroll>
      <div style={{ padding: "14px 24px 0" }}><BackLink label="‹ More" onClick={vm.goHub} /></div>
      <div style={{ padding: "12px 26px 14px" }}><div style={{ ...serif, fontSize: 34 }}>New group</div></div>
      <div style={{ padding: "0 24px 8px" }}>
        <div style={{ display: "flex", background: "var(--line)", borderRadius: 999, padding: 4 }}>
          <div data-testid="create-tab-start" onClick={vm.setStartTab} style={{ flex: 1, textAlign: "center", font: "600 14px var(--font-sans)", padding: 10, borderRadius: 999, cursor: "pointer", background: vm.startTabBg, color: vm.startTabColor }}>Start one</div>
          <div data-testid="create-tab-join" onClick={vm.setJoinTab} style={{ flex: 1, textAlign: "center", font: "600 14px var(--font-sans)", padding: 10, borderRadius: 999, cursor: "pointer", background: vm.joinTabBg, color: vm.joinTabColor }}>Join with code</div>
        </div>
      </div>
      {vm.createIsStart && (
        <div style={{ padding: "14px 26px 0" }}>
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>Name it</div>
          <input data-testid="create-name" value={vm.newGroupName} onChange={(e) => actions.setNewGroupName(e.target.value)} placeholder="Flat 4B, Goa trip, Book club…" style={{ width: "100%", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 15, font: "500 16px var(--font-sans)", color: "var(--ink)", background: "var(--surface-card)", outline: "none" }} />

          {/* Invite by username — invites are subject to acceptance (FR-09 social) */}
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", margin: "22px 0 10px" }}>Invite by username <span style={{ color: "#C9C2B6" }}>· optional</span></div>
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <input
              data-testid="invite-username"
              value={vm.inviteUsername}
              onChange={(e) => vm.setInviteUsername(e.target.value)}
              placeholder="@username"
              style={{ flex: 1, border: "1px solid var(--line-strong)", borderRadius: 14, padding: 14, font: "500 15px var(--font-sans)", color: "var(--ink)", background: "var(--surface-card)", outline: "none" }}
            />
            <div data-testid="invite-send" onClick={vm.sendUsernameInvite} style={{ background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 14, padding: "14px 18px", font: "600 14px var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>Invite</div>
          </div>
          {vm.groupPendingInvites.length > 0 ? (
            <div data-testid="pending-invites" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {vm.groupPendingInvites.map((p) => (
                <div key={p.id} data-testid={`pending-invite-${p.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 14px" }}>
                  <span style={{ font: "600 14px var(--font-sans)" }}>@{p.username}</span>
                  <span style={{ font: "600 11px var(--font-sans)", letterSpacing: ".04em", color: "#C9A24B", background: "#FBF3E6", borderRadius: 999, padding: "3px 9px" }}>INVITED</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--muted-2)", lineHeight: 1.5 }}>They&apos;ll join once they accept the invite — nobody is added without saying yes.</div>
          )}

          <div data-testid="create-submit" onClick={actions.createGroup} style={{ marginTop: 26, background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Create group</div>
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, color: "var(--muted-2)", lineHeight: 1.5 }}>You can add an expense before anyone joins — they&apos;ll see their share when they do.</div>
        </div>
      )}
      {vm.createIsJoin && (
        <div style={{ padding: "24px 26px 0" }}>
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 10 }}>Enter the code a friend shared</div>
          <input data-testid="join-code" value={vm.joinCode} onChange={(e) => actions.setJoinCode(e.target.value)} placeholder="ABCD123" style={{ width: "100%", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 18, font: "600 22px var(--font-sans)", letterSpacing: ".1em", textAlign: "center", color: "var(--ink)", background: "var(--surface-card)", outline: "none" }} />
          <div data-testid="join-submit" onClick={actions.joinGroup} style={{ marginTop: 22, background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Request to join</div>
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, color: "var(--muted-2)", lineHeight: 1.5 }}>Paste the code from the invite link.<br />The group admin will approve your request.</div>
        </div>
      )}
    </ScreenScroll>
  );
}

// ============ ENTRY DETAIL ============
export function EntryDetail() {
  const { vm } = useTally();
  const e = vm.entry;
  if (!e) return null;
  return (
    <ScreenScroll pad="8px 0 40px" style={{ background: "var(--surface)" }}>
      <div style={{ padding: "14px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BackLink label="‹ Back" onClick={vm.backFromEntry} testid="entry-back" />
        {e.canEdit ? (
          <span data-testid="entry-edit" onClick={() => vm.editEntry(e.raw)} style={{ font: "600 14px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>Edit</span>
        ) : (
          <span style={{ width: 46 }} />
        )}
      </div>
      <div style={{ padding: "18px 26px 22px", textAlign: "center", borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 62, height: 62, borderRadius: 18, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: e.catColor + "1f" }}>{e.catIcon}</div>
        <div style={{ ...serif, fontSize: 30, lineHeight: 1.05 }}>{e.title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{e.catLabel} · {e.when}</div>
        <div style={{ ...serif, fontSize: 64, lineHeight: 1.04, marginTop: 14 }}>{e.totalText}</div>
      </div>
      {e.isPersonal && (
        <div style={{ padding: "20px 26px 0" }}>
          <div style={{ background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: e.catColor + "1f", display: "flex", alignItems: "center", justifyContent: "center" }}>{e.catIcon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: "600 14px var(--font-sans)" }}>Counted in {e.catLabel}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Private to you</div>
            </div>
          </div>
          {e.note && (
            <div style={{ marginTop: 14, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, padding: "0 2px" }}>
              <span style={{ color: "var(--muted-2)" }}>Note · </span>{e.note}
            </div>
          )}
        </div>
      )}
      {e.shared && (
        <div style={{ padding: "18px 26px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
            <span>{e.group}</span><span>{e.paidBy} paid the bill</span>
          </div>
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 10 }}>Split between</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {e.rows.map((r) => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, background: r.rowBg, border: "1px solid var(--line)", borderRadius: 13, padding: "12px 14px" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface-sand)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px var(--font-sans)" }}>{r.initial}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 14px var(--font-sans)" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: r.color }}>{r.tag}</div>
                </div>
                <div style={{ font: "600 14px var(--font-sans)" }}>{r.owedText}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: "#EAF1EC", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-card)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#3F8E5B", fontSize: 15 }}>✓</span>
            <div style={{ fontSize: 13, lineHeight: 1.45, color: "#2F6B45" }}>Your <b>{e.yourShareText}</b> share was added to your personal spending — only you can see it.</div>
          </div>
          {e.disputed ? (
            <div style={{ marginTop: 12, background: "#F6EBE4", borderRadius: 14, padding: "13px 16px" }}>
              <div style={{ font: "600 13px var(--font-sans)", color: "#C2693E", marginBottom: 9 }}>You flagged this — the group has been notified.</div>
              <div style={{ display: "flex", gap: 9 }}>
                <div data-testid="dispute-resolve" onClick={() => vm.resolveDispute(e.id, e.title)} style={{ flex: 1, textAlign: "center", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", borderRadius: 12, padding: 11, font: "600 13px var(--font-sans)", cursor: "pointer" }}>Mark resolved</div>
                {e.canEdit && (
                  <div onClick={() => vm.editEntry(e.raw)} style={{ flex: 1, textAlign: "center", background: "var(--surface-card)", border: "1px solid var(--line-strong)", color: "var(--ink-soft)", borderRadius: 12, padding: 11, font: "600 13px var(--font-sans)", cursor: "pointer" }}>Propose a fix</div>
                )}
              </div>
            </div>
          ) : (
            <div data-testid="dispute-flag" onClick={() => vm.flagDispute(e.id, e.title)} style={{ marginTop: 12, textAlign: "center", border: "1px solid var(--line-strong)", borderRadius: 12, padding: 12, font: "600 13px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>
              Something off? Flag this for the group
            </div>
          )}
        </div>
      )}
    </ScreenScroll>
  );
}

// ============ INVITE ============
export function Invite() {
  const { vm, actions } = useTally();
  return (
    <ScreenScroll pad="8px 0 40px" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px 0" }}><span onClick={vm.goActiveGroup} style={{ font: "600 14px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>Skip</span></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 34px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "#EAF1EC", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{vm.inviteIcon}</div>
        <div style={{ ...serif, fontSize: 34, lineHeight: 1.05 }}>{vm.inviteName} is ready</div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>Share this so others can join. They don&apos;t need to install anything to see it.</div>
        <div style={{ marginTop: 26, width: "100%", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 16, padding: 18 }}>
          <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)" }}>Invite code</div>
          <div style={{ ...serif, fontSize: 34, letterSpacing: ".04em", marginTop: 4 }}>{vm.inviteCode}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{vm.inviteLink}</div>
        </div>
        <div data-testid="invite-copy" onClick={actions.copyInvite} style={{ marginTop: 18, width: "100%", background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 16, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Copy invite link</div>
        <div onClick={vm.goActiveGroup} style={{ marginTop: 12, font: "600 15px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>Go to the group →</div>
      </div>
    </ScreenScroll>
  );
}
