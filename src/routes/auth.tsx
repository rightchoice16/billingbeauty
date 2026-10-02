import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, setupAdmin } from "@/lib/accounts.functions";
import { inputCls, usernameToEmail } from "@/lib/billing";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Glow & Go Billing" },
      { name: "description", content: "Admin and branch sign in for Glow & Go beauty parlor billing." },
      { property: "og:title", content: "Sign in — Glow & Go Billing" },
      { property: "og:description", content: "Admin and branch sign in for Glow & Go billing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const exists = useQuery({ queryKey: ["admin-exists"], queryFn: () => adminExists() });
  const setup = exists.data && !exists.data.exists;
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (setup) await setupAdmin({ data: { username: u, password: p } });
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(u),
        password: p,
      });
      if (error) throw new Error("Wrong login ID or password");
      qc.clear();
      navigate({ to: "/bill", replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-8 ring-1 ring-border">
        <h1 className="font-display text-3xl font-medium">
          {setup ? "Create admin account" : "Sign in"}
        </h1>
        <p className="text-sm text-foreground/60">
          {setup
            ? "First time here — choose the admin login ID and password."
            : "Admins and branches use the login ID given to them."}
        </p>
        <input className={inputCls + " w-full"} placeholder="Login ID" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        <input className={inputCls + " w-full"} type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
        {err && <p className="text-sm text-coral">{err}</p>}
        <button disabled={busy || !u || !p} className="w-full rounded-full bg-plum py-3 font-medium text-lilac-soft disabled:opacity-50">
          {busy ? "Please wait…" : setup ? "Create & sign in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
