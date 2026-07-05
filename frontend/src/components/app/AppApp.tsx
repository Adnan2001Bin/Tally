import { useRef } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Shell } from "@/components/tally/Shell";
import { useLogoutMutation } from "@/lib/hooks/use-auth-actions";
import { getStoredUser } from "@/lib/auth/auth-storage";
import { TallyAuthProvider } from "@/lib/tally/auth-bridge";
import { ExpensesBridge } from "@/lib/tally/expenses-bridge";
import { GroupsBridge } from "@/lib/tally/groups-bridge";
import { AppSyncBridge } from "@/lib/tally/app-sync-bridge";
import { InviteBridge } from "@/lib/tally/invite-bridge";
import { ProfileBridge } from "@/lib/tally/profile-bridge";
import type { ExpenseHandlers } from "@/lib/tally/expense-handlers";
import type { GroupHandlers } from "@/lib/tally/group-handlers";
import { TallyProvider } from "@/lib/tally/store";
import { ThemeProvider } from "@/lib/tally/theme";
import { QueryProvider } from "@/lib/query/QueryProvider";

function TallyAppInner() {
  const user = getStoredUser();
  const logoutMutation = useLogoutMutation();
  const expenseHandlersRef = useRef<ExpenseHandlers | null>(null);
  const groupHandlersRef = useRef<GroupHandlers | null>(null);

  return (
    <TallyAuthProvider onSignOut={() => logoutMutation.mutate()}>
      <TallyProvider
        userName={user?.display_name ?? user?.username ?? undefined}
        expenseHandlersRef={expenseHandlersRef}
        groupHandlersRef={groupHandlersRef}
      >
        <ExpensesBridge handlersRef={expenseHandlersRef} />
        <GroupsBridge handlersRef={groupHandlersRef} />
        <AppSyncBridge />
        <InviteBridge />
        <ProfileBridge />
        <ThemeProvider>
          <div className="tally-app-backdrop">
            <Shell />
          </div>
        </ThemeProvider>
      </TallyProvider>
    </TallyAuthProvider>
  );
}

export default function AppApp() {
  return (
    <QueryProvider>
      <AuthGuard>
        <TallyAppInner />
      </AuthGuard>
    </QueryProvider>
  );
}
