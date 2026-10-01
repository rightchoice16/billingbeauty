import type { Tables } from "@/integrations/supabase/types";

export type ItemCategory = "Hair" | "Skin" | "Nails" | "Makeup" | "Other";
export const CATEGORIES: ItemCategory[] = ["Hair", "Skin", "Nails", "Makeup", "Other"];

export type Branch = Tables<"branches">;
export type Item = Tables<"items">;
export type StaffMember = Tables<"staff">;

export interface BillLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export type Bill = Omit<Tables<"bills">, "lines"> & { lines: BillLine[] };

export const TAX_RATE = 0.18;

export function calcTotals(lines: BillLine[], discount: number) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, tax, total };
}

export function formatINR(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export function invNo(n: number) {
  return "INV-" + String(n).padStart(4, "0");
}

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@glowgo.local`;
}

export const CATEGORY_STYLES: Record<string, { card: string; chip: string; icon: string }> = {
  Hair: { card: "bg-marigold-soft", chip: "bg-marigold text-plum", icon: "✂" },
  Skin: { card: "bg-coral-soft", chip: "bg-coral text-primary-foreground", icon: "◍" },
  Nails: { card: "bg-teal-soft", chip: "bg-teal text-primary-foreground", icon: "❋" },
  Makeup: { card: "bg-lilac-soft", chip: "bg-lilac text-plum", icon: "✿" },
  Other: { card: "bg-mint", chip: "bg-teal-soft text-plum", icon: "✦" },
};

export const inputCls =
  "rounded-xl bg-blush px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral";
