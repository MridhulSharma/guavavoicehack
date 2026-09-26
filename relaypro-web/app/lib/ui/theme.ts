export type Theme = "light" | "dark";

export const THEME_KEY = "relaypro-theme";

/**
 * Inlined into <head> so the html element carries data-theme before first
 * paint. Without it the page renders in the default theme for a frame and
 * flashes when the stored choice is applied. Kept dependency-free and
 * stringified, so it must stay valid standalone ES5-ish script text.
 */
export const THEME_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(
  THEME_KEY,
)};var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode / blocked storage: the choice just won't survive a reload.
  }
}

export function systemTheme(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

/** The theme the bootstrap script already put on <html>, if it ran. */
export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return readStoredTheme() ?? systemTheme();
}
