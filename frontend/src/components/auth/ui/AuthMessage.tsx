type AuthMessageProps = {
  message: string;
  variant: "error" | "success";
};

export function AuthMessage({ message, variant }: AuthMessageProps) {
  const color = variant === "error" ? "text-accent" : "text-success";

  return <div className={`mb-2.5 mt-0.5 px-0.5 text-[13px] leading-snug ${color}`}>{message}</div>;
}
