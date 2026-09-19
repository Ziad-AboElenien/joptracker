import type { Metadata } from "next";
import "./globals.css";
import { config as faConfig } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { Providers } from "@/components/providers";

// Prevent Font Awesome from injecting its CSS at runtime; we ship it above.
faConfig.autoAddCss = false;

export const metadata: Metadata = {
  title: "Kanban Job Tracker",
  description: "Trello-style board for tracking job applications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Apply persisted theme before hydration: avoids FOUC and keeps the
            `dark` class in sync. suppressHydrationWarning on <html> covers the
            resulting class attribute difference during hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("jt-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <div className="flex min-h-screen flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
