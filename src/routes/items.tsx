import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useStore,
  formatINR,
  CATEGORY_STYLES,
  type ItemCategory,
} from "../lib/store";

export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "Items & Services — Glow & Go Beauty Parlor Billing" },
      {
        name: "description",
        content: "Manage your beauty parlor's services and products with prices and durations.",
      },
      { property: "og:title", content: "Items & Services — Glow & Go Beauty Parlor Billing" },
      {
        property: "og:description",
        content: "Manage your beauty parlor's services and products with prices and durations.",
      },
    ],
  }),
  component: ItemsPage,
});

const CATEGORIES: ItemCategory[] = ["Hair", "Skin", "Nails", "Makeup", "Other"];

function ItemsPage() {
  const { items, addItem, removeItem } = useStore();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Hair");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!name.trim()) return setError("Enter an item name.");
    const p = Number(price);
    if (!p || p <= 0) return setError("Enter a valid price.");
    addItem({
      name: name.trim(),
      price: p,
      duration: Number(duration) || 30,
      category,
    });
    setName("");
    setPrice("");
    setDuration("");
    setError("");
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-14 lg:px-10">
      <div className="animate-fade-up mb-6">
        <h1 className="font-display text-5xl font-medium tracking-tight">Items &amp; services</h1>
        <p className="mt-2 text-foreground/55">
          Everything you offer, with the price that lands on the bill.
        </p>
      </div>

      <div className="animate-pop mb-8 rounded-[1.75rem] bg-card p-6 ring-1 ring-border">
        <div className="mb-4 font-display text-lg font-medium">Add a new item</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="rounded-xl bg-blush px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral lg:col-span-2"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (₹)"
            type="number"
            min={0}
            className="rounded-xl bg-blush px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral"
          />
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (min)"
            type="number"
            min={0}
            className="rounded-xl bg-blush px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="rounded-xl bg-blush px-3 py-2.5 text-sm text-foreground/70 ring-1 ring-border outline-none focus:ring-coral"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-coral">{error}</p>}
        <button
          onClick={handleAdd}
          className="mt-4 rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white ring-1 ring-coral"
        >
          Add item
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => {
          const style = CATEGORY_STYLES[item.category];
          return (
            <div
              key={item.id}
              className={`animate-pop flex flex-col gap-4 rounded-[1.5rem] ${style.card} p-5 ring-1 ring-border`}
              style={{ animationDelay: `${idx * 0.05}s` }}
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
                <div className="font-display text-3xl font-medium">{formatINR(item.price)}</div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground/60 ring-1 ring-border"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-foreground/50">
            No items yet — add your first service above.
          </p>
        )}
      </div>
    </main>
  );
}
