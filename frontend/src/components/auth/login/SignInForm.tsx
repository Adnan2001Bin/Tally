import { AuthField } from "@/components/auth/ui/AuthField";
import { AuthMessage } from "@/components/auth/ui/AuthMessage";
import { PrimaryButton } from "@/components/auth/ui/PrimaryButton";
import { useAuthErrorMessage, useLoginMutation } from "@/lib/hooks/use-auth-mutations";
import { useState } from "react";

type SignInFormProps = {
  onSwitchToCreate: () => void;
  onSuccess: () => void;
};

export function SignInForm({ onSwitchToCreate, onSuccess }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();
  const errorMessage = useAuthErrorMessage(loginMutation.error);

  const handleSubmit = async () => {
    try {
      await loginMutation.mutateAsync({ email, password });
      onSuccess();
    } catch {
      // error shown via mutation state
    }
  };

  return (
    <>
      <AuthField
        testId="login-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <AuthField
        testId="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {errorMessage && <AuthMessage variant="error" message={errorMessage} />}

      <PrimaryButton
        testId="login-signin"
        busy={loginMutation.isPending}
        onClick={handleSubmit}
      >
        Sign in
      </PrimaryButton>

      <div className="mt-3.5 flex justify-center gap-[18px] text-[13.5px]">
        <button
          type="button"
          onClick={onSwitchToCreate}
          className="cursor-pointer font-semibold text-accent"
        >
          Create an account
        </button>
      </div>
    </>
  );
}
