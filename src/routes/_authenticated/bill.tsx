import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/lib/branch-context";
import {
  CATEGORIES,
  CATEGORY_STYLES,
  calcTotals,
  formatINR,
  inputCls,
  invNo,
  type Bill,
  type BillLine,
  type Item,
  type StaffMember,
} from "@/lib/billing";
import { UpiQr } from "@/lib/upi-qr";
import { downloadBillPdf, printThermal } from "@/lib/receipt";

export const Route = createFileRoute("/_authenticated/bill")({
  head: () => ({ meta: [{ title: "New bill — Glow & Go" }] }),
  component: BillPage,
});

export function NoBranch() {
  return (
    <p className="mx-auto max-w-[1440px] px-10 py-10 text-foreground/60">
      No branch yet. The admin can create one under “Branches &amp; accounts”.
    </p>
  );
}

function BillPage() {
  const { branch } = useBranch();
  const qc = useQueryClient();
  const bid = branch?.id;
  const items = useQuery({
    queryKey: ["items", bid],
    enabled: !!bid,
    queryFn: async () =>
      ((await supabase.from("items").select("*").eq("branch_id", bid!).order("name")).data ?? []) as Item[],
  });
  const staff = useQuery({
    queryKey: ["staff", bid],
    enabled: !!bid,
    queryFn: async () =>
      ((await supabase.from("staff").select("*").eq("branch_id", bid!).order("name")).data ?? []) as StaffMember[],
  });
  const [cat, setCat] = useState<string>("All");
  const [lines, setLines] = useState<BillLine[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [staffId, setStaffId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [saved, setSaved] = useState<Bill | null>(null);
  const totals = calcTotals(lines, discount);

  const save = useMutation({
    mutationFn: async () => {
      const { data: last } = await supabase
        .from("bills")
        .select("number")
        .eq("branch_id", bid!)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const s = staff.data?.find((x) => x.id === staffId);
      const { data, error } = await supabase
        .from("bills")
        .insert({
          branch_id: bid!,
          number: (last?.number ?? 0) + 1,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          staff_id: s?.id ?? null,
          staff_name: s?.name ?? "—",
          lines: lines as any,
          discount,
          ...totals,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Bill;
    },
    onSuccess: (b) => {
      setSaved(b);
      setLines([]);
      setName("");
      setPhone("");
      setDiscount(0);
      qc.invalidateQueries({ queryKey: ["bills"] });
    },
    onError: (e: any) => alert(e.message),
  });

  if (!branch) return <NoBranch />;

  const add = (i: Item) =>
    setLines((ls) =>
      ls.some((l) => l.itemId === i.id)
        ? ls.map((l) => (l.itemId === i.id ? { ...l, qty: l.qty + 1 } : l))
        : [...ls, { itemId: i.id, name: i.name, price: Number(i.price), qty: 1 }],
    );
  const setQty = (id: string, d: number) =>
    setLines((ls) => ls.map((l) => (l.itemId === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));
  const shown = (items.data ?? []).filter((i) => cat === "All" || i.category === cat);

  return (
    <main className="mx-auto grid max-w-[1440px] gap-6 px-6 pb-16 lg:grid-cols-[1fr_420px] lg:px-10">
      <section>
        <div className="mb-4 flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm ring-1 ring-border ${cat === c ? "bg-plum text-lilac-soft" : "bg-card"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((i) => {
            const st = (CATEGORY_STYLES[i.category] ?? CATEGORY_STYLES["Other"])!;
            return (
              <div key={i.id} className={`rounded-3xl p-5 ${st.card}`}>
                <span className={`rounded-full px-3 py-1 text-xs ${st.chip}`}>{st.icon} {i.category}</span>
                <h3 className="mt-3 font-display text-lg font-medium">{i.name}</h3>
                <div className="mt-1 text-sm text-foreground/60">{i.duration} min</div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-xl">{formatINR(Number(i.price))}</span>
                  <button onClick={() => add(i)} className="rounded-full bg-plum px-4 py-2 text-sm text-lilac-soft">Add</button>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && <p className="text-foreground/50">No services yet — add some under Services.</p>}
        </div>
      </section>

      <aside className="h-fit space-y-4 rounded-3xl bg-card p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl font-medium">Bill · {branch.name}</h2>
        <input className={inputCls + " w-full"} placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls + " w-full"} placeholder="Customer phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <select className={inputCls + " w-full"} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          <option value="">Select staff</option>
          {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
        </select>
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.itemId} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex-1">{l.name}</span>
              <button onClick={() => setQty(l.itemId, -1)} className="size-7 rounded-full bg-blush">−</button>
              <span>{l.qty}</span>
              <button onClick={() => setQty(l.itemId, 1)} className="size-7 rounded-full bg-blush">+</button>
              <span className="w-20 text-right">{formatINR(l.price * l.qty)}</span>
            </div>
          ))}
          {lines.length === 0 && <p className="text-sm text-foreground/50">Add services from the left.</p>}
        </div>
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
          <div className="flex justify-between"><span>Tax 18%</span><span>{formatINR(totals.tax)}</span></div>
          <div className="flex items-center justify-between"><span>Discount</span>
            <input type="number" min={0} className={inputCls + " w-24 py-1 text-right"} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} />
          </div>
          <div className="flex justify-between pt-2 font-display text-2xl"><span>Total</span><span>{formatINR(totals.total)}</span></div>
        </div>
        {totals.total > 0 && <UpiQr amount={totals.total} upiId={branch.upi_id} payee={branch.name} />}
        <button
          disabled={!lines.length || !name.trim() || save.isPending}
          onClick={() => save.mutate()}
          className="w-full rounded-full bg-coral py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save bill"}
        </button>
        {saved && (
          <div className="space-y-2 rounded-2xl bg-mint p-4 text-sm">
            <div>Saved {invNo(saved.number)} · {formatINR(Number(saved.total))}</div>
            <div className="flex gap-2">
              <button onClick={() => printThermal(saved, branch)} className="rounded-full bg-plum px-4 py-2 text-lilac-soft">Print (thermal)</button>
              <button onClick={() => downloadBillPdf(saved, branch)} className="rounded-full bg-card px-4 py-2 ring-1 ring-border">Download PDF</button>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}
