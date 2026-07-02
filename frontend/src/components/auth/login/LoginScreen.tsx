import { AuthDivider } from "@/components/auth/ui/AuthDivider";
import { DemoButton } from "@/components/auth/ui/DemoButton";
import { LoginHeader } from "@/components/auth/login/LoginHeader";
import { ModeToggle, type AuthMode } from "@/components/auth/login/ModeToggle";
import { RegisterForm } from "@/components/auth/login/RegisterForm";
import { SignInForm } from "@/components/auth/login/SignInForm";
import { useState } from "react";

export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");

  const switchMode = (next: AuthMode) => {
    setMode(next);
  };

  const goHome = () => {
    window.location.href = "/";
  };

  const handleDemo = () => {
    window.location.href = "/demo";
  };

  return (
    <div
      data-testid="login-screen"
      className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center bg-canvas px-[30px] pb-[calc(28px+env(safe-area-inset-bottom))] text-ink shadow-2xl"
    >
      <LoginHeader mode={mode} />
      <ModeToggle mode={mode} onChange={switchMode} />

      {mode === "create" ? (
        <RegisterForm onSwitchToSignIn={() => switchMode("signin")} onSuccess={goHome} />
      ) : (
        <SignInForm onSwitchToCreate={() => switchMode("create")} onSuccess={goHome} />
      )}

      <AuthDivider />
      <DemoButton onClick={handleDemo} />
    </div>
  );
}
