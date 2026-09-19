"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", size = "md", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "outline" | "ghost" | "destructive"; size?: "sm" | "md" | "icon" }) {
  const base = "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-1 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    default: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
    primary: "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:brightness-110",
    outline: "border border-white/60 bg-white/60 backdrop-blur-xl hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/50 dark:hover:bg-slate-900/80",
    ghost: "hover:bg-white/70 dark:hover:bg-white/10",
    destructive: "bg-red-600/90 text-white shadow-sm hover:bg-red-500",
  };
  const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", icon: "h-9 w-9" };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

const fieldControl =
  "h-10 w-full rounded-xl border border-white/60 bg-white/70 px-3 text-sm shadow-sm backdrop-blur-xl transition outline-none placeholder:text-zinc-400 hover:bg-white/90 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/40 dark:border-white/10 dark:bg-slate-900/60 dark:placeholder:text-zinc-500 dark:hover:bg-slate-900/80 dark:focus:bg-slate-900 dark:focus:border-indigo-500";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldControl, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldControl, "h-auto min-h-20 py-2", props.className)} />;
}

export function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string | null; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <FontAwesomeIcon icon={faCircleExclamation} className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </label>
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn("inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/60 px-2.5 py-0.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-zinc-200", className)} />;
}

export const CardShell = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardShell({ className, ...props }, ref) {
  return <div ref={ref} {...props} className={cn("rounded-2xl border border-white/60 bg-white/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30", className)} />;
});

export function Modal({ open, onClose, title, icon, narrow, children }: { open: boolean; onClose: () => void; title: string; icon?: React.ReactNode; narrow?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="anim-overlay absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`anim-panel relative max-h-[90vh] w-full ${narrow ? "max-w-sm" : "max-w-lg"} overflow-y-auto rounded-2xl border border-white/60 bg-white/85 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85`}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:rotate-90 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
