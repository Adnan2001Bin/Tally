import { isAuthenticated } from "@/lib/auth/auth-storage";
import { redirectToApp } from "@/lib/auth/auth-routes";
import { AuthLoader } from "@/components/auth/AuthLoader";
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
    return <AuthLoader message="Checking session…" />;
  }

  return <>{children}</>;
}
