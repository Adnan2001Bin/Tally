import React from "react";
import { useTally } from "@/lib/tally/store";
import { BorrowAdd, Capture, Toast } from "./Overlays";
import { Audit, Borrow, Create, EntryDetail, GroupDetail, Groups, Home, Hub, Invite, Invites, MealClose, Meals, Notifications, Settings, Settle, Spending } from "./Screens";

// Real OS status bar clearance — no fake "9:41 / ●●●" chrome. The viewport is
// `viewportFit: cover` (layout.tsx), so content must clear the notch/status bar
// with the safe-area inset.
function SafeAreaTop() {
  return <div style={{ height: "env(safe-area-inset-top)", flexShrink: 0 }} aria-hidden />;
}

function OfflineBanner() {
  const { vm } = useTally();
  if (!vm.offline) return null;
  return (
    <div data-testid="offline-banner" style={{ background: "#FBF3E6", borderBottom: "1px solid #EFE2C6", padding: "7px 26px", font: "600 12px var(--font-sans)", color: "#9A7B2E", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0, zIndex: 2 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A24B" }} />
      Offline — entries save here and sync later
    </div>
  );
}

function BottomNav() {
  const { vm, actions } = useTally();
  if (!vm.showNav) return null;
  const item = (icon: React.ReactNode, label: string, color: string, onClick: () => void, testid: string) => (
    <div data-testid={testid} onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, font: "600 10px var(--font-sans)", cursor: "pointer", color }}>{icon}{label}</div>
  );
  return (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "11px 14px calc(24px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--line)", background: "var(--nav-bg)", zIndex: 2 }}>
      {item(vm.homeIcon, "Home", vm.navHome, vm.goHome, "nav-home")}
      {item(vm.spendIcon, "Spending", vm.navSpend, vm.goSpending, "nav-spending")}
      <div data-testid="fab-capture" onClick={actions.openCapture} style={{ width: 54, height: 54, borderRadius: "50%", background: vm.accent, display: "flex", alignItems: "center", justifyContent: "center", marginTop: -28, boxShadow: "0 10px 24px -7px rgba(194,105,62,.6)", cursor: "pointer" }}>{vm.plusIcon}</div>
      {item(vm.groupsIcon, "Groups", vm.navGroups, vm.goGroups, "nav-groups")}
      {item(vm.moreIcon, "More", vm.navHub, vm.goHub, "nav-more")}
    </div>
  );
}

function Body() {
  const { vm } = useTally();
  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {vm.isHome && <Home />}
      {vm.isSpending && <Spending />}
      {vm.isGroups && <Groups />}
      {vm.isGroup && <GroupDetail />}
      {vm.isSettle && <Settle />}
      {vm.isHub && <Hub />}
      {vm.isBorrow && <Borrow />}
      {vm.isMeals && <Meals />}
      {vm.isMealClose && <MealClose />}
      {vm.isCreate && <Create />}
      {vm.isEntry && <EntryDetail />}
      {vm.isInvite && <Invite />}
      {vm.isNotifications && <Notifications />}
      {vm.isSettings && <Settings />}
      {vm.isInvites && <Invites />}
      {vm.isAudit && <Audit />}
    </div>
  );
}

export function Shell() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        marginInline: "auto",
        height: "100dvh",
        background: "var(--surface)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: "var(--ink)",
      }}
      data-testid="app-shell"
    >
      <SafeAreaTop />
      <OfflineBanner />
      <Body />
      <BottomNav />
      <Capture />
      <BorrowAdd />
      <Toast />
    </div>
  );
}
