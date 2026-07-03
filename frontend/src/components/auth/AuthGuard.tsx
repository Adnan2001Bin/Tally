import { isAuthenticated } from "@/lib/auth/auth-storage";
import { redirectToLogin } from "@/lib/auth/auth-routes";
import { useEffect, useState, type ReactNode } from "react";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      redirectToLogin();
      return;
    }
    setAllowed(true);
  }, []);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0f0f0f] text-canvas">
        <p className="text-sm text-white/70">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
