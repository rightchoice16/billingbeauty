import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/lib/branch-context";
import { formatINR, type Bill } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — Glow & Go" }] }),
  component: Reports,
});

const RANGES = [
  { k: "today", label: "Today", days: 0 },
  { k: "7", label: "7 days", days: 7 },
  { k: "30", label: "30 days", days: 30 },
  { k: "all", label: "All time", days: -1 },
];

function Reports() {
  const { branches, isAdmin } = useBranch();
  const [range, setRange] = useState("30");
  const r = RANGES.find((x) => x.k === range)!;
  const from = (() => {
    if (r.days < 0) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - r.days);
    return d.toISOString();
  })();
  const bills = useQuery({
    queryKey: ["bills", "report", range],
    queryFn: async () => {
      let q = supabase.from("bills").select("*").order("date", { ascending: false }).limit(5000);
      if (from) q = q.gte("date", from);
      return ((await q).data ?? []) as unknown as Bill[];
    },
  });
  const all = bills.data ?? [];
  const sum = (bs: Bill[], k: "total" | "tax" | "discount") => bs.reduce((s, b) => s + Number(b[k]), 0);

  return (
    <main className="mx-auto max-w-[1440px] space-y-6 px-6 pb-16 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-medium">{isAdmin ? "All branches report" : "Branch report"}</h1>
        <div className="flex gap-2">
          {RANGES.map((x) => (
            <button key={x.k} onClick={() => setRange(x.k)} className={`rounded-full px-4 py-2 text-sm ring-1 ring-border ${range === x.k ? "bg-plum text-lilac-soft" : "bg-card"}`}>{x.label}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Revenue", formatINR(sum(all, "total"))], ["Bills", String(all.length)], ["Tax collected", formatINR(sum(all, "tax"))]].map(([l, v]) => (
          <div key={l} className="rounded-3xl bg-lilac-soft p-6"><div className="text-sm text-foreground/60">{l}</div><div className="font-display text-3xl">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {branches.map((br) => {
          const bs = all.filter((b) => b.branch_id === br.id);
          const staff = new Map<string, number>();
          const svc = new Map<string, number>();
          for (const b of bs) {
            staff.set(b.staff_name, (staff.get(b.staff_name) ?? 0) + Number(b.total));
            for (const l of b.lines) svc.set(l.name, (svc.get(l.name) ?? 0) + l.qty);
          }
          return (
            <div key={br.id} className="rounded-3xl bg-card p-6 ring-1 ring-border">
              <div className="flex items-center gap-3">
                {br.logo_url && <img src={br.logo_url} alt="" className="size-10 rounded-full object-cover" />}
                <h2 className="font-display text-xl font-medium">{br.name}</h2>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-foreground/50">Revenue</div><div className="font-medium">{formatINR(sum(bs, "total"))}</div></div>
                <div><div className="text-foreground/50">Bills</div><div className="font-medium">{bs.length}</div></div>
                <div><div className="text-foreground/50">Discounts</div><div className="font-medium">{formatINR(sum(bs, "discount"))}</div></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><div className="mb-1 font-medium">By staff</div>
                  {[...staff].sort((a, b) => b[1] - a[1]).map(([n, v]) => <div key={n} className="flex justify-between"><span>{n}</span><span>{formatINR(v)}</span></div>)}
                </div>
                <div><div className="mb-1 font-medium">Top services</div>
                  {[...svc].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => <div key={n} className="flex justify-between"><span className="truncate">{n}</span><span>×{v}</span></div>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
