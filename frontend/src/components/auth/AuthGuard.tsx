import { isAuthenticated } from "@/lib/auth/auth-storage";
import { redirectToLogin } from "@/lib/auth/auth-routes";
import { AuthLoader } from "@/components/auth/AuthLoader";
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
    return <AuthLoader message="Checking session…" />;
  }

  return <>{children}</>;
}
