type AuthLoaderProps = {
  message?: string;
};

export function AuthLoader({ message = "Loading…" }: AuthLoaderProps) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-[#0f0f0f]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-logo bg-ink">
          <span className="font-serif text-[34px] text-canvas">৳</span>
          <span
            className="auth-loader-ring absolute inset-0 rounded-logo border-2 border-canvas/20 border-t-canvas"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-medium text-white/70">{message}</p>
      </div>
    </div>
  );
}
