import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/lib/branch-context";
import { inputCls, type StaffMember } from "@/lib/billing";
import { NoBranch } from "./bill";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({ meta: [{ title: "Staff — Glow & Go" }] }),
  component: Staff,
});

function Staff() {
  const { branch } = useBranch();
  const qc = useQueryClient();
  const key = ["staff", branch?.id];
  const staff = useQuery({
    queryKey: key,
    enabled: !!branch,
    queryFn: async () => ((await supabase.from("staff").select("*").eq("branch_id", branch!.id).order("name")).data ?? []) as StaffMember[],
  });
  const [name, setName] = useState("");
  const [role, setRole] = useState("Stylist");
  if (!branch) return <NoBranch />;
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("staff").insert({ branch_id: branch!.id, name: name.trim(), role: role.trim() || "Stylist" });
    if (error) return alert(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: key });
  }
  async function remove(id: string) {
    await supabase.from("staff").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: key });
  }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 pb-16">
      <h1 className="font-display text-3xl font-medium">Staff · {branch.name}</h1>
      <form onSubmit={add} className="flex gap-2 rounded-3xl bg-card p-5 ring-1 ring-border">
        <input className={inputCls + " flex-1"} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls + " w-40"} placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <button disabled={!name.trim()} className="rounded-full bg-plum px-5 text-lilac-soft disabled:opacity-50">Add</button>
      </form>
      {staff.data?.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-2xl bg-card px-5 py-3 ring-1 ring-border">
          <div><div className="font-medium">{s.name}</div><div className="text-xs text-foreground/50">{s.role}</div></div>
          <button onClick={() => remove(s.id)} className="text-sm text-coral">Remove</button>
        </div>
      ))}
    </main>
  );
}
