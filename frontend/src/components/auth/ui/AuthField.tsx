import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  testId?: string;
};

export function AuthField({ testId, className = "", ...props }: AuthFieldProps) {
  return (
    <input
      data-testid={testId}
      className={`mb-[11px] w-full rounded-field border border-line bg-white px-[15px] py-[15px] text-base font-medium text-ink outline-none placeholder:text-muted-2 focus:border-ink/30 ${className}`}
      {...props}
    />
  );
}
