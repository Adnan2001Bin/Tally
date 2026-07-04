import { useState, type InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  testId?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.8 11.8 0 0 1-2.2 3.3" />
        <path d="M6.1 6.1A11.8 11.8 0 0 0 1 12.5C2.7 16.9 7 20 12 20a10.5 10.5 0 0 0 4.1-.8" />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12.5C3.7 8.1 8 5 13 5s9.3 3.1 11 7.5C22.3 16.9 18 20 13 20S3.7 16.9 2 12.5Z" />
      <circle cx="13" cy="12.5" r="3" />
    </svg>
  );
}

export function AuthField({ testId, className = "", type, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  const inputClassName = `w-full rounded-field border border-line bg-white px-[15px] py-[15px] text-base font-medium text-ink outline-none placeholder:text-muted-2 focus:border-ink/30 ${
    isPassword ? "pr-12" : ""
  } ${className}`;

  if (!isPassword) {
    return (
      <input
        data-testid={testId}
        type={type}
        className={`mb-[11px] ${inputClassName}`}
        {...props}
      />
    );
  }

  return (
    <div className="relative mb-[11px]">
      <input
        data-testid={testId}
        type={inputType}
        className={inputClassName}
        {...props}
      />
      <button
        type="button"
        data-testid={testId ? `${testId}-toggle` : undefined}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-2 transition-colors hover:text-ink"
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}
