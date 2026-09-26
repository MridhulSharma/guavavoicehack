"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  currentTheme,
  readStoredTheme,
  storeTheme,
  systemTheme,
  type Theme,
} from "@/app/lib/ui/theme";

type ThemeContextValue = {
  theme: Theme;
  /** False until the first client effect runs, so SSR markup stays stable. */
  ready: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  ready: false,
  toggleTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server render and first paint both assume light; the bootstrap script has
  // already set data-theme, so all *visuals* are correct and only this state
  // catches up on mount. Nothing theme-dependent is rendered from JS before
  // `ready`, which keeps hydration free of mismatches.
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setReady(true);
  }, []);

  // Follow the OS only while the user has made no explicit choice.
  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }

    const onChange = () => {
      if (readStoredTheme() === null) setTheme(systemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme, ready]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      storeTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, ready, toggleTheme }),
    [theme, ready, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
