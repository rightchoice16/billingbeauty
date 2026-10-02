import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/lib/branch-context";
import { CATEGORIES, formatINR, inputCls, type Item } from "@/lib/billing";
import { NoBranch } from "./bill";

export const Route = createFileRoute("/_authenticated/items")({
  head: () => ({ meta: [{ title: "Services — Glow & Go" }] }),
  component: Items,
});

function Items() {
  const { branch } = useBranch();
  const qc = useQueryClient();
  const key = ["items", branch?.id];
  const items = useQuery({
    queryKey: key,
    enabled: !!branch,
    queryFn: async () => ((await supabase.from("items").select("*").eq("branch_id", branch!.id).order("name")).data ?? []) as Item[],
  });
  const [f, setF] = useState({ name: "", price: "", duration: "30", category: "Hair" });
  if (!branch) return <NoBranch />;
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("items").insert({ branch_id: branch!.id, name: f.name.trim(), price: Number(f.price), duration: Number(f.duration), category: f.category });
    if (error) return alert(error.message);
    setF({ ...f, name: "", price: "" });
    qc.invalidateQueries({ queryKey: key });
  }
  async function remove(id: string) {
    await supabase.from("items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: key });
  }
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 pb-16">
      <h1 className="font-display text-3xl font-medium">Services · {branch.name}</h1>
      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-3xl bg-card p-5 ring-1 ring-border">
        <input className={inputCls + " flex-1"} placeholder="Service name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={inputCls + " w-28"} type="number" placeholder="Price ₹" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input className={inputCls + " w-24"} type="number" placeholder="Min" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />
        <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button disabled={!f.name.trim() || !f.price} className="rounded-full bg-plum px-5 text-lilac-soft disabled:opacity-50">Add</button>
      </form>
      <div className="space-y-2">
        {items.data?.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-2xl bg-card px-5 py-3 ring-1 ring-border">
            <div><div className="font-medium">{i.name}</div><div className="text-xs text-foreground/50">{i.category} · {i.duration} min</div></div>
            <div className="flex items-center gap-4"><span>{formatINR(Number(i.price))}</span><button onClick={() => remove(i.id)} className="text-sm text-coral">Remove</button></div>
          </div>
        ))}
      </div>
    </main>
  );
}
