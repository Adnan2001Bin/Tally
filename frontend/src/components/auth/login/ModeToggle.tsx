export type AuthMode = "signin" | "create";

type ModeToggleProps = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

function Tab({
  active,
  label,
  testId,
  onClick,
}: {
  active: boolean;
  label: string;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex-1 rounded-full px-2.5 py-2.5 text-center text-sm font-semibold transition-all ${
        active
          ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          : "bg-transparent text-muted"
      }`}
    >
      {label}
    </button>
  );
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mb-[18px] flex rounded-full bg-surface p-1">
      <Tab
        active={mode === "signin"}
        label="Sign in"
        testId="login-tab-signin"
        onClick={() => onChange("signin")}
      />
      <Tab
        active={mode === "create"}
        label="Create account"
        testId="login-tab-create"
        onClick={() => onChange("create")}
      />
    </div>
  );
}
