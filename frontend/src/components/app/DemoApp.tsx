import { Shell } from "@/components/tally/Shell";
import { redirectToLogin } from "@/lib/auth/auth-routes";
import { TallyAuthProvider } from "@/lib/tally/auth-bridge";
import { TallyProvider } from "@/lib/tally/store";
import { ThemeProvider } from "@/lib/tally/theme";
import { QueryProvider } from "@/lib/query/QueryProvider";

export default function DemoApp() {
  return (
    <QueryProvider>
      <TallyAuthProvider mode="demo" onSignOut={redirectToLogin}>
        <TallyProvider>
          <ThemeProvider>
            <div className="tally-app-backdrop">
              <Shell />
            </div>
          </ThemeProvider>
        </TallyProvider>
      </TallyAuthProvider>
    </QueryProvider>
  );
}
