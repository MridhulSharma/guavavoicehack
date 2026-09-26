"use client";

import { useTheme } from "@/app/components/ThemeProvider";

/**
 * A real switch: role="switch" + aria-checked, reachable by Tab, operable by
 * Enter/Space for free because it is a <button>. The knob position and which
 * icon shows are pure CSS off [data-theme], so the control looks right from
 * the very first paint and only aria-checked waits for hydration.
 */
export function ThemeToggle() {
  const { theme, ready, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ready ? theme === "dark" : undefined}
      aria-label="Night theme"
      onClick={toggleTheme}
      className="theme-switch"
    >
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-knob">
          <SunIcon />
          <MoonIcon />
        </span>
      </span>
      <span aria-hidden="true">
        <span className="icon-day-label">Day</span>
        <span className="icon-night-label">Night</span>
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      className="icon-day"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v2.5M12 20v2.5M1.5 12h2.5M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="icon-night"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21 14.5A9.2 9.2 0 0 1 9.5 3a9.5 9.5 0 1 0 11.5 11.5Z" />
    </svg>
  );
}
