export type ExpenseHandlers = {
  isLive: boolean;
  createPersonal: (input: { amount: number; description: string }) => Promise<void>;
  getErrorMessage: (error: unknown) => string;
};
