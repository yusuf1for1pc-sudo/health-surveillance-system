import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "tempest-theme";

const current = (): Theme =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(current);

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeState(current()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    try { localStorage.setItem(KEY, t); } catch { /* storage unavailable */ }
  }, []);

  const toggle = useCallback(() => setTheme(current() === "dark" ? "light" : "dark"), [setTheme]);

  return { theme, setTheme, toggle };
}
