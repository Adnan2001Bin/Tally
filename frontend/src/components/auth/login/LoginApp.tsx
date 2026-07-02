import { LoginScreen } from "./LoginScreen";
import { QueryProvider } from "@/lib/query/QueryProvider";

export default function LoginApp() {
  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-[#0f0f0f]">
      <QueryProvider>
        <LoginScreen />
      </QueryProvider>
    </div>
  );
}
