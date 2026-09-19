"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { Input, Button, CardShell, Field } from "@/components/ui/primitives";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@example.com");
  const router = useRouter();
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <CardShell className="anim-panel w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
            <FontAwesomeIcon icon={faLayerGroup} className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Your personal job board awaits</p>
          </div>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Demo credentials login — any email works locally. Each user gets their own board.</p>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
        </Field>
        <Button
          variant="primary"
          className="w-full"
          onClick={async () => {
            await signIn("credentials", { email, password: "demo", callbackUrl: "/board" });
            router.push("/board");
          }}
        >
          <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" /> Continue with Email
        </Button>
        <Button variant="outline" className="w-full" onClick={() => signIn("github", { callbackUrl: "/board" })}>
          <FontAwesomeIcon icon={faGithub} className="h-4 w-4" /> Continue with GitHub
        </Button>
      </CardShell>
    </main>
  );
}
