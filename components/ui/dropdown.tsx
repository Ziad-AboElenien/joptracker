"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}

/**
 * Glassy custom dropdown replacing native <select>.
 * Motion: menu drops in (anim-menu), chevron rotates. Keyboard: ArrowUp/Down
 * to move, Enter to pick, Escape to close, full listbox ARIA roles.
 */
export function Dropdown({ value, onChange, options, placeholder = "Select…", ariaLabel, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(options[highlight]?.value ?? "");
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(options.length - 1);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/70 px-3 text-sm shadow-sm backdrop-blur-xl transition hover:border-indigo-300 hover:bg-white/90 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-indigo-500/50 dark:hover:bg-slate-900/80"
      >
        <span className={cn("truncate", !selected && "text-zinc-400 dark:text-zinc-500")}>
          {selected ? selected.label : placeholder}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={cn("h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={onMenuKey}
          ref={(el) => el?.focus()}
          className="anim-menu absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-white/60 bg-white/90 p-1 shadow-xl backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-slate-900/90"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-zinc-400">No options</li>}
          {options.map((o, i) => {
            const active = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => pick(o.value)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  i === highlight ? "bg-indigo-500/15 text-indigo-950 dark:bg-indigo-400/20 dark:text-indigo-100" : "text-zinc-700 dark:text-zinc-200",
                  active && "font-semibold"
                )}
              >
                <span className="truncate">{o.label}</span>
                {active && <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 text-indigo-500" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
