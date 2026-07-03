import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/app/AppShell";
import { QueryProvider } from "@/lib/query/QueryProvider";

export default function AppApp() {
  return (
    <QueryProvider>
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    </QueryProvider>
  );
}
