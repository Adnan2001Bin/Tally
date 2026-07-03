import { isAuthenticated } from "@/lib/auth/auth-storage";
import { redirectToApp } from "@/lib/auth/auth-routes";
import { useEffect, useState, type ReactNode } from "react";

type GuestGuardProps = {
  children: ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      redirectToApp();
      return;
    }
    setAllowed(true);
  }, []);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0f0f0f] text-canvas">
        <p className="text-sm text-white/70">Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}
