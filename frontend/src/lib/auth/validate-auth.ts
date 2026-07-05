const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(input: {
  email: string;
  password: string;
  display_name: string;
}): string | null {
  const email = input.email.trim();
  const displayName = input.display_name.trim();
  const { password } = input;

  if (!email) return "Enter your email.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";

  if (!displayName) return "Enter your full name.";
  if (displayName.length < 2) return "Full name must be at least 2 characters.";
  if (displayName.length > 100) return "Full name must be at most 100 characters.";

  if (!password) return "Choose a password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";

  return null;
}

export function validateLoginInput(input: { email: string; password: string }): string | null {
  const email = input.email.trim();
  if (!email) return "Enter your email.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (!input.password) return "Enter your password.";
  return null;
}
