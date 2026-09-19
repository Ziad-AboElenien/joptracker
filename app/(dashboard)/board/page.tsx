import { Board } from "@/components/board/Board";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BoardPage() {
  // Protected route: require session unless demo mode (no GitHub creds configured
  // and no DB) — in that case we still render with demo-user fallback in APIs.
  const session = await getServerSession(authOptions);
  const authStrict = process.env.AUTH_STRICT === "1";
  if (!session && authStrict) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban Job Tracker</h1>
          <p className="text-sm text-zinc-500">{session?.user?.email ? `Signed in as ${session.user.email}` : "Demo mode — sign in to get your own board"}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link href="/api/auth/signout" className="rounded-md border px-3 py-2 text-sm">Sign out</Link>
          ) : (
            <Link href="/login" className="rounded-md border px-3 py-2 text-sm">Sign in</Link>
          )}
        </div>
      </header>
      <Board />
    </main>
  );
}
