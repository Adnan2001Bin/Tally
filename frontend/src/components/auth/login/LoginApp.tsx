import { LoginScreen } from "./LoginScreen";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { QueryProvider } from "@/lib/query/QueryProvider";

export default function LoginApp() {
  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-[#0f0f0f]">
      <QueryProvider>
        <GuestGuard>
          <LoginScreen />
        </GuestGuard>
      </QueryProvider>
    </div>
  );
}
