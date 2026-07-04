import { AuthGuard } from "@/components/auth/AuthGuard";
import { Shell } from "@/components/tally/Shell";
import { useLogoutMutation } from "@/lib/hooks/use-auth-actions";
import { getStoredUser } from "@/lib/auth/auth-storage";
import { TallyAuthProvider } from "@/lib/tally/auth-bridge";
import { TallyProvider } from "@/lib/tally/store";
import { ThemeProvider } from "@/lib/tally/theme";
import { QueryProvider } from "@/lib/query/QueryProvider";

function TallyAppInner() {
  const user = getStoredUser();
  const logoutMutation = useLogoutMutation();

  return (
    <TallyAuthProvider mode="signed-in" onSignOut={() => logoutMutation.mutate()}>
      <TallyProvider userName={user?.username ?? undefined}>
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
