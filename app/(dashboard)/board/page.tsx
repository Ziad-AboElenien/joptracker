import { Board } from "@/components/board/Board";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartColumn, faLayerGroup, faRightFromBracket, faRightToBracket, faTableColumns } from "@fortawesome/free-solid-svg-icons";

export default async function BoardPage() {
  // Protected route: require session unless demo mode (no GitHub creds configured
  // and no DB) — in that case we still render with demo-user fallback in APIs.
  // getServerSession can throw in production when auth env is missing
  // (e.g. NEXTAUTH_SECRET); fall back to demo mode instead of crashing.
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  const authStrict = process.env.AUTH_STRICT === "1";
  if (!session && authStrict) redirect("/login");

  const navLink =
    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-indigo-500/10 hover:text-indigo-700 dark:text-zinc-300 dark:hover:text-indigo-300";

  return (
    <main id="top" className="mx-auto w-full max-w-7xl flex-1 scroll-mt-24 p-4">
      <header className="sticky top-3 z-40 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
            <FontAwesomeIcon icon={faLayerGroup} className="h-5 w-5" />
          </span>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-xl font-extrabold leading-tight text-transparent dark:from-indigo-300 dark:to-cyan-300">
              Kanban Job Tracker
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{session?.user?.email ? `Signed in as ${session.user.email}` : "Demo mode — sign in to get your own board"}</p>
          </div>
        </div>
        <nav className="flex items-center gap-1" aria-label="Sections">
          <a href="#top" className={navLink}>
            <FontAwesomeIcon icon={faTableColumns} className="h-3.5 w-3.5" /> Board
          </a>
          <a href="#analytics" className={navLink}>
            <FontAwesomeIcon icon={faChartColumn} className="h-3.5 w-3.5" /> Analytics
          </a>
          <span className="mx-1 h-6 w-px bg-zinc-300/70 dark:bg-white/10" />
          <ThemeToggle />
          {session ? (
            <Link href="/api/auth/signout" className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-sm font-medium backdrop-blur-xl transition hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/50 dark:hover:bg-slate-900/80">
              <FontAwesomeIcon icon={faRightFromBracket} className="h-3.5 w-3.5" /> Sign out
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.97]">
              <FontAwesomeIcon icon={faRightToBracket} className="h-3.5 w-3.5" /> Sign in
            </Link>
          )}
        </nav>
      </header>
      <Board />
    </main>
  );
}
