import { useRef } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Shell } from "@/components/tally/Shell";
import { useLogoutMutation } from "@/lib/hooks/use-auth-actions";
import { getStoredUser } from "@/lib/auth/auth-storage";
import { TallyAuthProvider } from "@/lib/tally/auth-bridge";
import { ExpensesBridge } from "@/lib/tally/expenses-bridge";
import { ProfileBridge } from "@/lib/tally/profile-bridge";
import type { ExpenseHandlers } from "@/lib/tally/expense-handlers";
import { TallyProvider } from "@/lib/tally/store";
import { ThemeProvider } from "@/lib/tally/theme";
import { QueryProvider } from "@/lib/query/QueryProvider";

function TallyAppInner() {
  const user = getStoredUser();
  const logoutMutation = useLogoutMutation();
  const expenseHandlersRef = useRef<ExpenseHandlers | null>(null);

  return (
    <TallyAuthProvider onSignOut={() => logoutMutation.mutate()}>
      <TallyProvider
        userName={user?.username ?? undefined}
        expenseHandlersRef={expenseHandlersRef}
      >
        <ExpensesBridge handlersRef={expenseHandlersRef} />
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
