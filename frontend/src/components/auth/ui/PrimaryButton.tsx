import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  busy?: boolean;
  testId?: string;
};

export function PrimaryButton({
  children,
  busy = false,
  testId,
  disabled,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled || busy}
      className={`w-full rounded-card px-[17px] py-[17px] text-center text-base font-semibold text-canvas transition-colors ${
        busy || disabled ? "cursor-not-allowed bg-muted" : "cursor-pointer bg-ink hover:bg-ink/90"
      } ${className}`}
      {...props}
    >
      {busy ? "…" : children}
    </button>
  );
}
