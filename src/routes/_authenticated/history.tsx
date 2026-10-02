import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/lib/branch-context";
import { formatINR, inputCls, invNo, type Bill } from "@/lib/billing";
import { downloadBillPdf, printThermal } from "@/lib/receipt";
import { NoBranch } from "./bill";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Bill history — Glow & Go" }] }),
  component: History,
});

function History() {
  const { branch } = useBranch();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const bills = useQuery({
    queryKey: ["bills", "list", branch?.id],
    enabled: !!branch,
    queryFn: async () =>
      ((await supabase.from("bills").select("*").eq("branch_id", branch!.id).order("date", { ascending: false }).limit(300)).data ?? []) as unknown as Bill[],
  });
  if (!branch) return <NoBranch />;
  const list = (bills.data ?? []).filter((b) =>
    (b.customer_name + b.customer_phone + invNo(b.number)).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-medium">Bills · {branch.name}</h1>
        <input className={inputCls} placeholder="Search name, phone, INV…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.map((b) => (
        <div key={b.id} className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <button onClick={() => setOpen(open === b.id ? null : b.id)} className="flex w-full items-center justify-between text-left">
            <div>
              <div className="font-medium">{invNo(b.number)} · {b.customer_name}</div>
              <div className="text-xs text-foreground/50">{new Date(b.date).toLocaleString("en-IN")} · {b.staff_name}</div>
            </div>
            <span className="font-display text-xl">{formatINR(Number(b.total))}</span>
          </button>
          {open === b.id && (
            <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              {b.customer_phone && <div>Phone: {b.customer_phone}</div>}
              {b.lines.map((l) => (
                <div key={l.itemId} className="flex justify-between"><span>{l.name} × {l.qty}</span><span>{formatINR(l.price * l.qty)}</span></div>
              ))}
              <div className="flex justify-between text-foreground/60"><span>Tax</span><span>{formatINR(Number(b.tax))}</span></div>
              {Number(b.discount) > 0 && <div className="flex justify-between text-foreground/60"><span>Discount</span><span>−{formatINR(Number(b.discount))}</span></div>}
              <div className="flex gap-2 pt-3">
                <button onClick={() => printThermal(b, branch)} className="rounded-full bg-plum px-4 py-2 text-lilac-soft">Print (thermal)</button>
                <button onClick={() => downloadBillPdf(b, branch)} className="rounded-full bg-card px-4 py-2 ring-1 ring-border">Download PDF</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <p className="text-foreground/50">No bills yet.</p>}
    </main>
  );
}
