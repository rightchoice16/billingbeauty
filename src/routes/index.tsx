import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useStore,
  calcTotals,
  formatINR,
  CATEGORY_STYLES,
  type BillLine,
  type ItemCategory,
} from "../lib/store";
import { UpiQr } from "../lib/upi-qr";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Bill — Glow & Go Beauty Parlor Billing" },
      {
        name: "description",
        content:
          "Build a bill: pick services, enter customer details, assign a staff member, and print the receipt.",
      },
      { property: "og:title", content: "New Bill — Glow & Go Beauty Parlor Billing" },
      {
        property: "og:description",
        content:
          "Build a bill: pick services, enter customer details, assign a staff member, and print the receipt.",
      },
    ],
  }),
  component: NewBillPage,
});

const CATEGORIES: ("All" | ItemCategory)[] = ["All", "Hair", "Skin", "Nails", "Makeup", "Other"];

function NewBillPage() {
  const { items, staff, bills, saveBill, nextBillNumber } = useStore();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [staffId, setStaffId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<BillLine[]>([]);
  const [error, setError] = useState("");

  const visibleItems = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  const totals = calcTotals(lines, discount);
  const recent = bills.slice(0, 3);

  function addLine(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === itemId);
      if (existing) {
        return prev.map((l) =>
          l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { itemId, name: item.name, price: item.price, qty: 1 }];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function clearBill() {
    setLines([]);
    setCustomerName("");
    setCustomerPhone("");
    setStaffId("");
    setDiscount(0);
    setError("");
  }

  function handleSave(print: boolean) {
    if (!customerName.trim()) return setError("Enter the customer name.");
    if (lines.length === 0) return setError("Add at least one item to the bill.");
    const member = staff.find((s) => s.id === staffId);
    saveBill({
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      staffId: member?.id ?? null,
      staffName: member?.name ?? "—",
      lines,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount,
      total: totals.total,
    });
    clearBill();
    if (print) {
      navigate({ to: "/history" });
    }
  }

  return (
    <main className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-8 px-6 pb-14 lg:grid-cols-[1.6fr_1fr] lg:px-10">
      <section className="animate-fade-up">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-medium tracking-tight text-balance">
              Build the bill
            </h1>
            <p className="mt-2 max-w-[48ch] text-pretty text-foreground/55">
              Tap a service to drop it on the receipt. Totals update as you go.
            </p>
          </div>
          <span className="hidden text-sm text-foreground/45 lg:inline">
            {items.length} services
          </span>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={
                filter === c
                  ? "rounded-full bg-plum px-4 py-1.5 text-sm text-lilac-soft"
                  : "rounded-full bg-card px-4 py-1.5 text-sm text-foreground/60 ring-1 ring-border"
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleItems.map((item, idx) => {
            const style = CATEGORY_STYLES[item.category];
            return (
              <div
                key={item.id}
                className={`animate-pop flex flex-col gap-4 rounded-[1.5rem] ${style.card} p-5 ring-1 ring-border`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`grid size-10 place-items-center rounded-xl text-lg ${style.chip}`}>
                    {style.icon}
                  </div>
                  <div className="leading-tight">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-foreground/50">
                      {item.category} · {item.duration} min
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-display text-3xl font-medium">
                    {formatINR(item.price)}
                  </div>
                  <button
                    onClick={() => addLine(item.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${style.chip}`}
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
          {visibleItems.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-foreground/50">
              No items in this category yet — add some from Items &amp; services.
            </p>
          )}
        </div>

        {recent.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 text-sm uppercase tracking-[0.15em] text-foreground/50">
              Recent bills
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {recent.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
                >
                  <div className="grid size-10 place-items-center rounded-full bg-coral-soft font-medium text-coral">
                    {b.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <div className="font-medium">{b.customerName}</div>
                    <div className="text-xs text-foreground/50">
                      {b.lines.map((l) => l.name).slice(0, 2).join(" + ")}
                    </div>
                  </div>
                  <div className="ml-auto text-sm font-medium">{formatINR(b.total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="animate-fade-up lg:sticky lg:top-6">
        <div className="animate-pop rounded-[1.75rem] bg-card p-6 ring-1 ring-border">
          <div className="mb-5 flex items-center justify-between">
            <div className="font-display text-lg font-medium">Today's bill</div>
            <span className="text-xs uppercase tracking-[0.15em] text-foreground/40">
              #INV-{String(nextBillNumber).padStart(4, "0")}
            </span>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="flex-1 rounded-xl bg-blush px-3 py-2 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone"
              className="flex-1 rounded-xl bg-blush px-3 py-2 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral"
            />
          </div>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="mb-5 w-full rounded-xl bg-blush px-3 py-2 text-sm text-foreground/70 ring-1 ring-border outline-none focus:ring-coral"
          >
            <option value="">Styled by · select staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.role}
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-3 pb-4">
            {lines.length === 0 && (
              <p className="py-4 text-center text-sm text-foreground/45">
                No items yet — tap a service to add it.
              </p>
            )}
            {lines.map((l) => (
              <div key={l.itemId} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="flex items-center gap-2 text-xs text-foreground/45">
                    <button
                      onClick={() => changeQty(l.itemId, -1)}
                      className="grid size-5 place-items-center rounded-full bg-lilac-soft ring-1 ring-border"
                    >
                      −
                    </button>
                    ×{l.qty}
                    <button
                      onClick={() => changeQty(l.itemId, 1)}
                      className="grid size-5 place-items-center rounded-full bg-lilac-soft ring-1 ring-border"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="font-medium">{formatINR(l.price * l.qty)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-dashed border-foreground/15 pt-4 text-sm">
            <div className="flex justify-between text-foreground/60">
              <span>Subtotal</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-foreground/60">
              <span>Service tax 18%</span>
              <span>{formatINR(totals.tax)}</span>
            </div>
            <div className="flex items-center justify-between text-foreground/60">
              <span>Discount</span>
              <input
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="₹0"
                className="w-24 rounded-lg bg-blush px-2 py-1 text-right text-sm ring-1 ring-border outline-none focus:ring-coral"
              />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm uppercase tracking-[0.15em] text-foreground/50">Total</span>
            <span className="font-display text-5xl leading-none font-medium">
              {formatINR(totals.total)}
            </span>
          </div>

          {totals.total > 0 && (
            <div className="mt-4">
              <UpiQr amount={totals.total} />
            </div>
          )}

          {error && <p className="mt-3 text-sm font-medium text-coral">{error}</p>}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => handleSave(true)}
              className="flex-1 rounded-full bg-coral py-3 text-sm font-medium text-white ring-1 ring-coral"
            >
              Save bill
            </button>
            <button
              onClick={clearBill}
              className="rounded-full bg-lilac px-4 py-3 text-sm font-medium text-plum ring-1 ring-lilac"
            >
              Clear
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
