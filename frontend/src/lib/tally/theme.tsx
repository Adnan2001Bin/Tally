// Theme: light | dark, persisted to localStorage, defaulting to the OS
// (prefers-color-scheme). Applies a `dark` class + data-theme="dark" on <html>;
// globals.css overrides the warm-palette CSS vars under that selector.
// The first paint is set by a tiny blocking script in layout.tsx (THEME_INIT)
// so there's no flash; this provider keeps React state in sync after mount.
import React, { createContext, useCallback, useContext, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "tally-theme";

// Inlined into <head> (before paint) to set the initial class with no FOUC.
// Kept as a string so it runs before React hydrates.
export const THEME_INIT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var e=document.documentElement;e.classList.toggle('dark',t==='dark');e.setAttribute('data-theme',t);}catch(_){}})();`;

function readInitial(): Theme {
  if (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark") return "dark";
  if (typeof window !== "undefined") {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("dark", theme === "dark");
  el.setAttribute("data-theme", theme);
}

interface ThemeCtx {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The blocking THEME_INIT script sets <html data-theme> before hydration, so the
  // lazy initializer reads the already-correct value on the client (no flash, and
  // no sync setState in an effect). On the server it returns "light"; the provider
  // renders no theme-dependent markup itself (the look comes from CSS vars on <html>),
  // so there's no hydration mismatch.
  const [theme, setThemeState] = useState<Theme>(readInitial);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    apply(t);
    try {
      window.localStorage?.setItem(STORAGE_KEY, t);
    } catch {
      /* storage may be unavailable (private mode) — theme still applies in-memory */
    }
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return <Ctx.Provider value={{ theme, isDark: theme === "dark", setTheme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
