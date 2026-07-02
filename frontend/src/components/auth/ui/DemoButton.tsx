type DemoButtonProps = {
  onClick: () => void;
};

export function DemoButton({ onClick }: DemoButtonProps) {
  return (
    <>
      <button
        type="button"
        data-testid="login-demo"
        onClick={onClick}
        className="w-full cursor-pointer rounded-card border border-line bg-white px-4 py-4 text-center text-base font-semibold text-ink transition-colors hover:bg-canvas"
      >
        Explore the demo
      </button>
      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-muted-2">
        No account needed to look around. Demo data stays on this device.
      </p>
    </>
  );
}
