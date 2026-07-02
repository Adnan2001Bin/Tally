type LoginHeaderProps = {
  mode: "signin" | "create";
};

export function LoginHeader({ mode }: LoginHeaderProps) {
  const isCreate = mode === "create";

  return (
    <div className="mb-[26px] text-center">
      <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-logo bg-ink">
        <span className="font-serif text-[34px] text-canvas">৳</span>
      </div>
      <h1 className="font-serif text-[40px] leading-[1.02]">
        {isCreate ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 font-serif text-base italic text-muted">
        {isCreate ? "one ledger, two lenses" : "Tally · one ledger, two lenses"}
      </p>
    </div>
  );
}
