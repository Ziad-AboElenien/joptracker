"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Input, Button, CardShell } from "@/components/ui/primitives";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@example.com");
  const router = useRouter();
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <CardShell className="w-full max-w-sm space-y-3 p-6">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="text-sm text-zinc-500">Demo credentials login — any email works locally. Each user gets their own board.</p>
        <label className="text-sm">Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>
        <Button
          className="w-full"
          onClick={async () => {
            await signIn("credentials", { email, password: "demo", callbackUrl: "/board" });
            router.push("/board");
          }}
        >
          Continue with Email
        </Button>
        <Button variant="outline" className="w-full" onClick={() => signIn("github", { callbackUrl: "/board" })}>
          Continue with GitHub
        </Button>
      </CardShell>
    </main>
  );
}
