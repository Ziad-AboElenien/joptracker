import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Kanban Job Tracker",
  description: "Trello-style board for tracking job applications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <div className="flex min-h-screen flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
