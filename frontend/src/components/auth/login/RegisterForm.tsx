import { AuthField } from "@/components/auth/ui/AuthField";
import { AuthMessage } from "@/components/auth/ui/AuthMessage";
import { PrimaryButton } from "@/components/auth/ui/PrimaryButton";
import { useAuthErrorMessage, useRegisterMutation } from "@/lib/hooks/use-auth-mutations";
import { useState } from "react";

type RegisterFormProps = {
  onSwitchToSignIn: () => void;
  onSuccess: () => void;
};

export function RegisterForm({ onSwitchToSignIn, onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const registerMutation = useRegisterMutation();
  const errorMessage = useAuthErrorMessage(registerMutation.error);

  const handleSubmit = async () => {
    setNote(null);
    try {
      await registerMutation.mutateAsync({ email, password, username });
      setNote("Account created — signing you in…");
      onSuccess();
    } catch {
      // error shown via mutation state
    }
  };

  return (
    <>
      <AuthField
        testId="register-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <AuthField
        testId="register-username"
        type="text"
        autoComplete="username"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <AuthField
        testId="register-password"
        type="password"
        autoComplete="new-password"
        placeholder="Choose a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {errorMessage && <AuthMessage variant="error" message={errorMessage} />}
      {note && <AuthMessage variant="success" message={note} />}

      <PrimaryButton
        testId="login-signup"
        busy={registerMutation.isPending}
        onClick={handleSubmit}
      >
        Create account
      </PrimaryButton>

      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-muted-2">
        New here — we&apos;ll sign you in right away. Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="cursor-pointer font-semibold text-accent"
        >
          Sign in
        </button>
      </p>
    </>
  );
}
