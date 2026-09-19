"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/primitives";

/**
 * Hydration-safe theme toggle.
 * Server and first client render always show the same icon (Moon). The real
 * theme class is applied pre-hydration by an inline script in app/layout.tsx
 * (avoids FOUC), and this component reads it after mount. The mount-only
 * setState below is intentional: it syncs React with the external DOM state
 * exactly once, after hydration, so SSR HTML and first client render match.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("jt-theme", next ? "dark" : "light");
        } catch {
          // private mode etc. — theme just won't persist
        }
      }}
    >
      {mounted && dark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
