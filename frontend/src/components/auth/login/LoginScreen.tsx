import { LoginHeader } from "@/components/auth/login/LoginHeader";
import { ModeToggle, type AuthMode } from "@/components/auth/login/ModeToggle";
import { RegisterForm } from "@/components/auth/login/RegisterForm";
import { SignInForm } from "@/components/auth/login/SignInForm";
import { redirectToApp } from "@/lib/auth/auth-routes";
import { useState } from "react";

export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");

  const switchMode = (next: AuthMode) => {
    setMode(next);
  };

  const goApp = () => {
    redirectToApp();
  };

  return (
    <div
      data-testid="login-screen"
      className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-canvas px-[30px] pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] text-ink shadow-2xl"
    >
      <div className="my-auto w-full">
        <LoginHeader mode={mode} />
        <ModeToggle mode={mode} onChange={switchMode} />

        {mode === "create" ? (
          <RegisterForm onSwitchToSignIn={() => switchMode("signin")} onSuccess={goApp} />
        ) : (
          <SignInForm onSwitchToCreate={() => switchMode("create")} onSuccess={goApp} />
        )}
      </div>
    </div>
  );
}
