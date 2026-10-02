import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/lib/branch-context";
import { createBranch, deleteBranch, resetBranchPassword } from "@/lib/accounts.functions";
import { inputCls, type Branch } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/branches")({
  head: () => ({ meta: [{ title: "Branches & accounts — Glow & Go" }] }),
  component: Branches,
});

async function fileToLogo(file: File): Promise<string> {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  const s = Math.min(1, 240 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

const empty = { name: "", address: "", phone: "", upiId: "", logoUrl: null as string | null, username: "", password: "" };

function Branches() {
  const { isAdmin, branches } = useBranch();
  const qc = useQueryClient();
  const create = useServerFn(createBranch);
  const reset = useServerFn(resetBranchPassword);
  const del = useServerFn(deleteBranch);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["branches"] });

  if (!isAdmin) return <p className="px-10 py-10">Only the admin can manage branches.</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await create({ data: f });
      setF(empty);
      refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-[1440px] gap-6 px-6 pb-16 lg:grid-cols-[420px_1fr] lg:px-10">
      <form onSubmit={submit} className="h-fit space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border">
        <h2 className="font-display text-2xl font-medium">New branch</h2>
        <input className={inputCls + " w-full"} placeholder="Branch name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <textarea className={inputCls + " w-full"} placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <input className={inputCls + " w-full"} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className={inputCls + " w-full"} placeholder="Billing UPI ID (e.g. name@okicici)" value={f.upiId} onChange={(e) => setF({ ...f, upiId: e.target.value })} />
        <label className="block text-sm text-foreground/60">Logo
          <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setF({ ...f, logoUrl: await fileToLogo(file) }); }} />
        </label>
        {f.logoUrl && <img src={f.logoUrl} alt="Logo preview" className="size-16 rounded-xl object-cover" />}
        <div className="border-t border-border pt-3 text-sm font-medium">Branch login</div>
        <input className={inputCls + " w-full"} placeholder="Login ID" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input className={inputCls + " w-full"} type="password" placeholder="Password (min 6)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {err && <p className="text-sm text-coral">{err}</p>}
        <button disabled={busy || !f.name || !f.username || f.password.length < 6} className="w-full rounded-full bg-plum py-3 text-lilac-soft disabled:opacity-50">
          {busy ? "Creating…" : "Create branch"}
        </button>
      </form>
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-medium">Branches & accounts</h2>
        {branches.map((b) => (
          <BranchCard key={b.id} b={b} onChange={refresh}
            onReset={async (pw) => { await reset({ data: { branchId: b.id, password: pw } }); alert("Password updated"); }}
            onDelete={async () => { if (confirm(`Delete ${b.name} and all its bills?`)) { await del({ data: { branchId: b.id } }); refresh(); } }} />
        ))}
        {branches.length === 0 && <p className="text-foreground/50">No branches yet.</p>}
      </section>
    </main>
  );
}

function BranchCard({ b, onChange, onReset, onDelete }: { b: Branch; onChange: () => void; onReset: (pw: string) => Promise<void>; onDelete: () => void }) {
  const [e, setE] = useState({ name: b.name, address: b.address, phone: b.phone, upi_id: b.upi_id, logo_url: b.logo_url });
  const [pw, setPw] = useState("");
  async function save() {
    const { error } = await supabase.from("branches").update(e).eq("id", b.id);
    if (error) return alert(error.message);
    onChange();
  }
  return (
    <div className="space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border">
      <div className="flex items-center gap-3">
        {e.logo_url ? <img src={e.logo_url} alt="" className="size-12 rounded-xl object-cover" /> : <div className="size-12 rounded-xl bg-lilac-soft" />}
        <div className="flex-1"><div className="font-display text-lg">{b.name}</div><div className="text-xs text-foreground/50">Login ID: {b.username}</div></div>
        <button onClick={onDelete} className="text-sm text-coral">Delete</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} placeholder="Name" />
        <input className={inputCls} value={e.phone} onChange={(x) => setE({ ...e, phone: x.target.value })} placeholder="Phone" />
        <input className={inputCls + " sm:col-span-2"} value={e.address} onChange={(x) => setE({ ...e, address: x.target.value })} placeholder="Address" />
        <input className={inputCls} value={e.upi_id} onChange={(x) => setE({ ...e, upi_id: x.target.value })} placeholder="UPI ID" />
        <input type="file" accept="image/*" className="text-sm" onChange={async (x) => { const file = x.target.files?.[0]; if (file) setE({ ...e, logo_url: await fileToLogo(file) }); }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={save} className="rounded-full bg-plum px-4 py-2 text-sm text-lilac-soft">Save details</button>
        <input className={inputCls + " py-1.5"} type="password" placeholder="New password" value={pw} onChange={(x) => setPw(x.target.value)} />
        <button disabled={pw.length < 6} onClick={() => onReset(pw).then(() => setPw(""))} className="rounded-full bg-card px-4 py-2 text-sm ring-1 ring-border disabled:opacity-50">Reset password</button>
      </div>
    </div>
  );
}
