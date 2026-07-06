import React from "react";
import { useTally } from "@/lib/tally/store";
import { serif } from "./ui";

const sheetWrap: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
};
const backdrop: React.CSSProperties = { position: "absolute", inset: 0, background: "rgba(27,25,22,.4)", animation: "fadeIn .2s ease" };
const sheet: React.CSSProperties = { position: "relative", background: "var(--surface)", borderRadius: "30px 30px 0 0", padding: "10px 0 26px", animation: "sheetUp .3s cubic-bezier(.22,1,.36,1)" };
const grip = <div style={{ width: 40, height: 5, borderRadius: 99, background: "#DAD4C8", margin: "6px auto 12px" }} />;

export function Capture() {
  const { vm, actions } = useTally();
  if (!vm.captureOpen) return null;
  return (
    <div style={sheetWrap}>
      <div onClick={actions.closeCapture} style={backdrop} />

      {vm.captureInput && (
        <div style={sheet}>
          {grip}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px 8px" }}>
            <span onClick={actions.closeCapture} style={{ font: "600 15px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>Cancel</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {vm.captureIsGroupExpense && (
                <span style={{ font: "600 11px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "#3F8E5B" }}>{vm.captureGroupName}</span>
              )}
              <div style={{ display: "flex", background: "var(--line)", borderRadius: 999, padding: 3 }}>
                <span data-testid="capture-say-mode" onClick={actions.modeSay} style={{ font: "600 13px var(--font-sans)", padding: "7px 15px", borderRadius: 999, cursor: "pointer", background: vm.sayBg, color: vm.sayColor }}>Say it</span>
                <span data-testid="capture-manual-mode" onClick={actions.modeManual} style={{ font: "600 13px var(--font-sans)", padding: "7px 15px", borderRadius: 999, cursor: "pointer", background: vm.manualBg, color: vm.manualColor }}>Type amount</span>
              </div>
            </div>
            <span style={{ width: 46 }} />
          </div>

          {vm.modeIsSay && (
            <div style={{ padding: "14px 24px 0" }}>
              <div style={{ ...serif, fontSize: 24, lineHeight: 1.25, color: "var(--ink)" }}>
                {vm.captureIsGroupExpense ? "What did the group spend?" : "Tell Tally what happened."}
              </div>
              <textarea
                data-testid="capture-text"
                onChange={(e) => actions.onCaptureInput(e.target.value)}
                value={vm.captureText}
                placeholder={vm.captureIsGroupExpense ? "dinner 500, I paid, split me and Alex" : "dinner 500, I paid, split me and Alex"}
                style={{ width: "100%", marginTop: 14, minHeight: 92, resize: "none", border: "1px solid var(--line-strong)", borderRadius: 16, padding: 15, font: "500 16px var(--font-sans)", color: "var(--ink)", background: "var(--surface-card)", outline: "none", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {vm.sayExamples.map((ex, i) => (
                  <span key={i} onClick={ex.use} style={{ font: "500 13px var(--font-sans)", color: "var(--muted)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>{ex.label}</span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
                <div data-testid="capture-make-draft" onClick={actions.runParse} style={{ flex: 1, background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Make a draft</div>
                <div style={{ width: 54, height: 54, borderRadius: "50%", border: "1px solid var(--line-strong)", background: "var(--surface-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#C2693E", cursor: "pointer" }}>◉</div>
              </div>
            </div>
          )}

          {vm.modeIsManual && (
            <div style={{ padding: "6px 24px 0" }}>
              <div style={{ textAlign: "center", padding: "14px 0 6px" }}>
                <div style={{ font: "500 11px var(--font-sans)", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted-2)" }}>Amount</div>
                <div style={{ ...serif, fontSize: 66, lineHeight: 1, marginTop: 4 }}><span style={{ fontSize: 32, color: "var(--muted)" }}>৳</span><span data-testid="manual-amount">{vm.manualAmount}</span></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "10px 0 4px", flexWrap: "wrap" }}>
                <span style={{ font: "600 13px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "8px 14px" }}>+ Who</span>
                <span style={{ font: "600 13px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "8px 14px", display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C2693E" }} />Food</span>
                <span style={{ font: "600 13px var(--font-sans)", color: "var(--ink-soft)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "8px 14px" }}>+ Split</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
                {vm.keys.map((k) => (
                  <div key={k.label} data-testid={`keypad-${k.label === "⌫" ? "del" : k.label === "." ? "dot" : k.label}`} onClick={k.press} style={{ textAlign: "center", padding: "14px 0", font: "400 26px var(--font-sans)", color: k.color, cursor: "pointer" }}>{k.label}</div>
                ))}
              </div>
              <div data-testid="manual-confirm" onClick={actions.confirmManual} style={{ marginTop: 6, background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>{vm.captureIsGroupExpense ? "Next — split it" : "Add expense"}</div>
            </div>
          )}
        </div>
      )}

      {vm.captureDraft && vm.draft && (
        <div style={{ ...sheet, maxHeight: "92%", minHeight: vm.captureIsEditing ? "min(88vh, 680px)" : undefined, overflowY: "auto" }}>
          {grip}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px 6px" }}>
            {vm.captureIsEditing ? (
              <span onClick={actions.closeCapture} style={{ font: "600 15px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>Cancel</span>
            ) : (
              <span data-testid="draft-edit-words" onClick={actions.backToInput} style={{ font: "600 15px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>‹ Edit words</span>
            )}
            <span style={{ font: "600 12px var(--font-sans)", color: "#3F8E5B" }}>
              {vm.captureIsEditing ? "Editing group expense" : "✓ Understood"}
            </span>
            <span style={{ width: 46 }} />
          </div>
          <div style={{ padding: "8px 26px 0" }}>
            <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>
              {vm.captureIsEditing ? "Update the split — fix anything" : "Here's the draft — fix anything"}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{vm.draft.title} · {vm.draft.groupLabel}</div>
            <div style={{ ...serif, fontSize: 46, lineHeight: 1.02 }}>{vm.draft.totalText}</div>

            {vm.draft.unresolved.map((u) => (
              <div key={u.raw} style={{ background: "#F6EBE4", borderRadius: 14, padding: "12px 14px", margin: "14px 0 4px" }}>
                <div style={{ font: "600 13px var(--font-sans)", color: "#C2693E", marginBottom: 9 }}>Who is “{u.raw}”?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {u.options.map((o) => (
                    <span key={o.name} onClick={o.assign} style={{ font: "600 12px var(--font-sans)", background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "7px 12px", cursor: "pointer" }}>{o.name}</span>
                  ))}
                </div>
              </div>
            ))}

            {(vm.draft.isShared || vm.captureIsGroupExpense) && (
              <>
                <div style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)", margin: "16px 0 8px" }}>Who paid</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {vm.draft.payerChips.map((p) => (
                    <span key={p.name} onClick={p.pick} style={{ font: "600 13px var(--font-sans)", borderRadius: 999, padding: "8px 14px", cursor: "pointer", background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>{p.name}</span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 9px" }}>
                  <span style={{ font: "600 11px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)" }}>Split between</span>
                  <div style={{ display: "flex", background: "var(--line)", borderRadius: 999, padding: 3 }}>
                    <span data-testid="draft-method-equal" onClick={() => actions.setDraftMethod("equal")} style={{ font: "600 12px var(--font-sans)", padding: "6px 13px", borderRadius: 999, cursor: "pointer", background: vm.draft.equalBg, color: vm.draft.equalColor }}>Equal</span>
                    <span data-testid="draft-method-exact" onClick={() => actions.setDraftMethod("exact")} style={{ font: "600 12px var(--font-sans)", padding: "6px 13px", borderRadius: 999, cursor: "pointer", background: vm.draft.exactBg, color: vm.draft.exactColor }}>Exact</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
                  {vm.draft.partChips.map((c) => (
                    <span key={c.name} onClick={c.toggle} style={{ font: "600 13px var(--font-sans)", borderRadius: 999, padding: "8px 14px", cursor: "pointer", background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{c.name}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {vm.draft.rows.map((r) => (
                    <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px" }}>
                      <div>
                        <div style={{ font: "600 14px var(--font-sans)" }}>{r.name}</div>
                        <div style={{ fontSize: 11.5, color: r.color }}>{r.tag}</div>
                      </div>
                      {r.isExact ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ color: "var(--muted)", font: "600 14px var(--font-sans)" }}>৳</span>
                          <input value={r.owedVal} onChange={(e) => vm.draft!.editOwed(r.name, e.target.value)} inputMode="numeric" style={{ width: 62, textAlign: "right", border: "1px solid var(--line-strong)", borderRadius: 9, padding: "7px 8px", font: "600 14px var(--font-sans)", color: "var(--ink)", outline: "none", background: "var(--surface)" }} />
                        </div>
                      ) : (
                        <span style={{ font: "600 14px var(--font-sans)", color: r.isAuto ? "var(--muted)" : "var(--ink)" }}>{r.owedText}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 11, font: "600 13px var(--font-sans)", color: vm.draft.statusColor }}>{vm.draft.statusText}</div>
              </>
            )}

            {vm.draft.isPersonal && !vm.captureIsGroupExpense && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>Just you — this goes straight into your personal spending.</div>
            )}
            {vm.captureIsGroupExpense && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>This expense is split in <b>{vm.captureGroupName}</b>. Everyone&apos;s share updates their balance.</div>
            )}

            <div data-testid="capture-confirm-draft" onClick={actions.confirmDraft} style={{ margin: "18px 0 4px", background: vm.draft.confirmBg, color: "var(--surface)", textAlign: "center", borderRadius: 16, padding: 17, font: "600 16px var(--font-sans)", cursor: "pointer" }}>{vm.draft.confirmLabel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BorrowAdd() {
  const { vm, actions } = useTally();
  if (!vm.borrowAddOpen) return null;
  return (
    <div style={sheetWrap}>
      <div onClick={actions.closeBorrowAdd} style={backdrop} />
      <div style={sheet}>
        {grip}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px 10px" }}>
          <span onClick={actions.closeBorrowAdd} style={{ font: "600 15px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>Cancel</span>
          <span style={{ font: "600 14px var(--font-sans)", color: "var(--ink)" }}>Track a borrow</span>
          <span data-testid="borrow-save" onClick={actions.saveBorrow} style={{ font: "600 15px var(--font-sans)", color: "#C2693E", cursor: "pointer" }}>Save</span>
        </div>
        <div style={{ padding: "6px 24px 0" }}>
          <div style={{ display: "flex", background: "var(--line)", borderRadius: 999, padding: 4, marginBottom: 18 }}>
            <span onClick={() => actions.setBorrowType("money")} style={{ flex: 1, textAlign: "center", font: "600 14px var(--font-sans)", padding: 10, borderRadius: 999, cursor: "pointer", background: vm.baMoneyTab.bg, color: vm.baMoneyTab.color }}>Money</span>
            <span onClick={() => actions.setBorrowType("item")} style={{ flex: 1, textAlign: "center", font: "600 14px var(--font-sans)", padding: 10, borderRadius: 999, cursor: "pointer", background: vm.baItemTab.bg, color: vm.baItemTab.color }}>An item</span>
          </div>
          <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
            <span onClick={() => actions.setBorrowDir("lent")} style={{ flex: 1, textAlign: "center", font: "600 13px var(--font-sans)", borderRadius: 12, padding: 11, cursor: "pointer", background: vm.baLent.bg, color: vm.baLent.color, border: `1px solid ${vm.baLent.border}` }}>{vm.baDirLentLabel}</span>
            <span onClick={() => actions.setBorrowDir("borrowed")} style={{ flex: 1, textAlign: "center", font: "600 13px var(--font-sans)", borderRadius: 12, padding: 11, cursor: "pointer", background: vm.baBorrowed.bg, color: vm.baBorrowed.color, border: `1px solid ${vm.baBorrowed.border}` }}>{vm.baDirBorrowedLabel}</span>
          </div>
          {vm.baMoney && (
            <>
              <input value={vm.baWho} onChange={(e) => actions.setBorrowField("who", e.target.value)} placeholder="Who? (name)" style={inp} />
              <input value={vm.baAmount} onChange={(e) => actions.setBorrowField("amount", e.target.value)} inputMode="numeric" placeholder="How much? (৳)" style={{ ...inp, fontWeight: 600 }} />
              <input value={vm.baDue} onChange={(e) => actions.setBorrowField("due", e.target.value)} placeholder="Due date — optional (e.g. Fri)" style={{ ...inp, marginBottom: 0, fontSize: 15 }} />
              <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted-2)", lineHeight: 1.5 }}>Money loans settle through the same “mark paid” as any group debt.</div>
            </>
          )}
          {vm.baItem && (
            <>
              <input value={vm.baItemVal} onChange={(e) => actions.setBorrowField("item", e.target.value)} placeholder="What item? (e.g. drill)" style={inp} />
              <input value={vm.baWho} onChange={(e) => actions.setBorrowField("who", e.target.value)} placeholder="Who? (name)" style={{ ...inp, marginBottom: 0 }} />
              <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted-2)", lineHeight: 1.5 }}>Items are just a return reminder — no money, kept apart from debts.</div>
            </>
          )}
          <div onClick={actions.saveBorrow} style={{ marginTop: 18, background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", textAlign: "center", borderRadius: 16, padding: 16, font: "600 16px var(--font-sans)", cursor: "pointer" }}>Save</div>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid var(--line-strong)", borderRadius: 13, padding: 14, font: "500 16px var(--font-sans)", color: "var(--ink)", background: "var(--surface-card)", outline: "none", marginBottom: 10 };

export function Toast() {
  const { vm } = useTally();
  if (!vm.toast) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 96, display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
      <div data-testid="toast" style={{ background: "var(--chip-on-bg)", color: "var(--chip-on-fg)", font: "600 14px var(--font-sans)", padding: "12px 20px", borderRadius: 999, animation: "pop .3s ease", boxShadow: "0 12px 28px -10px rgba(0,0,0,.5)" }}>{vm.toast}</div>
    </div>
  );
}
