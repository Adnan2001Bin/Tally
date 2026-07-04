import React, { createContext, useContext } from "react";

export type TallyAuthMode = "demo" | "signed-in";

type TallyAuthContextValue = {
  status: TallyAuthMode;
  signOut: () => void;
};

const TallyAuthContext = createContext<TallyAuthContextValue | null>(null);

type TallyAuthProviderProps = {
  children: React.ReactNode;
  mode: TallyAuthMode;
  onSignOut: () => void;
};

export function TallyAuthProvider({ children, mode, onSignOut }: TallyAuthProviderProps) {
  return (
    <TallyAuthContext.Provider value={{ status: mode, signOut: onSignOut }}>
      {children}
    </TallyAuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(TallyAuthContext);
  if (!ctx) throw new Error("useAuth must be used within TallyAuthProvider");
  return {
    status: ctx.status === "signed-in" ? ("in" as const) : ("demo" as const),
    signOut: ctx.signOut,
  };
}
