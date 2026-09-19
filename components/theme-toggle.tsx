"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/primitives";

function initialDark(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("jt-theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(initialDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => {
        const next = !dark;
        setDark(next);
        localStorage.setItem("jt-theme", next ? "dark" : "light");
      }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
