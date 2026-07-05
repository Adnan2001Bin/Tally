export type UpdateProfileInput = {
  monthly_budget?: number | null;
};

export class UserError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "UserError";
  }
}
