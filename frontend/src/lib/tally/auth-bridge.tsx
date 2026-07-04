import React, { createContext, useContext } from "react";

type TallyAuthContextValue = {
  signOut: () => void;
};

const TallyAuthContext = createContext<TallyAuthContextValue | null>(null);

type TallyAuthProviderProps = {
  children: React.ReactNode;
  onSignOut: () => void;
};

export function TallyAuthProvider({ children, onSignOut }: TallyAuthProviderProps) {
  return (
    <TallyAuthContext.Provider value={{ signOut: onSignOut }}>
      {children}
    </TallyAuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(TallyAuthContext);
  if (!ctx) throw new Error("useAuth must be used within TallyAuthProvider");
  return { signOut: ctx.signOut };
}
