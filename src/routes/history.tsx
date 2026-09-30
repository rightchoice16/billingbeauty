import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatINR, type Bill } from "../lib/store";
import { UpiQr } from "../lib/upi-qr";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Bill History — Glow & Go Beauty Parlor Billing" },
      {
        name: "description",
        content: "Every bill your parlor has saved, with customer, staff, and item details.",
      },
      { property: "og:title", content: "Bill History — Glow & Go Beauty Parlor Billing" },
      {
        property: "og:description",
        content: "Every bill your parlor has saved, with customer, staff, and item details.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { bills } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const todayTotal = bills
    .filter((b) => new Date(b.date).toDateString() === new Date().toDateString())
    .reduce((s, b) => s + b.total, 0);

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-14 lg:px-10">
      <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-medium tracking-tight">Bill history</h1>
          <p className="mt-2 text-foreground/55">Every receipt, saved at the counter.</p>
        </div>
        <div className="rounded-2xl bg-card px-5 py-3 ring-1 ring-border">
          <div className="text-xs uppercase tracking-[0.15em] text-foreground/45">Today's collection</div>
          <div className="font-display text-2xl font-medium">{formatINR(todayTotal)}</div>
        </div>
      </div>

      {bills.length === 0 && (
        <p className="rounded-[1.75rem] bg-card py-16 text-center text-sm text-foreground/50 ring-1 ring-border">
          No bills yet — create your first one from New bill.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {bills.map((b, idx) => (
          <BillCard
            key={b.id}
            bill={b}
            open={openId === b.id}
            onToggle={() => setOpenId(openId === b.id ? null : b.id)}
            delay={idx * 0.04}
          />
        ))}
      </div>
    </main>
  );
}

function BillCard({
  bill,
  open,
  onToggle,
  delay,
}: {
  bill: Bill;
  open: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const date = new Date(bill.date);
  return (
    <div
      className="animate-pop rounded-[1.5rem] bg-card ring-1 ring-border"
      style={{ animationDelay: `${delay}s` }}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-5 text-left">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-coral-soft font-medium text-coral">
          {bill.customerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-medium">{bill.customerName}</div>
          <div className="text-xs text-foreground/50">
            #INV-{String(bill.number).padStart(4, "0")} · {bill.staffName} ·{" "}
            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })},{" "}
            {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="font-display text-xl font-medium">{formatINR(bill.total)}</span>
          <span className="text-foreground/40">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-dashed border-foreground/15 px-5 pt-4 pb-5">
          <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-foreground/45">Customer</div>
              <div className="font-medium">{bill.customerName}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-foreground/45">Phone</div>
              <div className="font-medium">{bill.customerPhone || "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-foreground/45">Staff</div>
              <div className="font-medium">{bill.staffName}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-foreground/45">Date</div>
              <div className="font-medium">{date.toLocaleDateString("en-IN")}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            {bill.lines.map((l, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {l.name} <span className="text-foreground/45">×{l.qty}</span>
                </span>
                <span className="font-medium">{formatINR(l.price * l.qty)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1 border-t border-dashed border-foreground/15 pt-3 text-sm text-foreground/60">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service tax 18%</span>
              <span>{formatINR(bill.tax)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-teal">−{formatINR(bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-medium text-foreground">
              <span>Total</span>
              <span>{formatINR(bill.total)}</span>
            </div>
          </div>

          <div className="mt-4 max-w-sm">
            <UpiQr amount={bill.total} size={110} />
          </div>

          <button
            onClick={() => window.print()}
            className="mt-4 rounded-full bg-lilac px-5 py-2 text-sm font-medium text-plum ring-1 ring-lilac"
          >
            Print receipt
          </button>
        </div>
      )}
    </div>
  );
}
