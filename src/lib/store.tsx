import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ItemCategory = "Hair" | "Skin" | "Nails" | "Makeup" | "Other";

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  duration: number; // minutes
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface BillLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Bill {
  id: string;
  number: number;
  date: string; // ISO
  customerName: string;
  customerPhone: string;
  staffId: string | null;
  staffName: string;
  lines: BillLine[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

interface StoreState {
  items: Item[];
  staff: StaffMember[];
  bills: Bill[];
  addItem: (item: Omit<Item, "id">) => void;
  removeItem: (id: string) => void;
  addStaff: (s: Omit<StaffMember, "id">) => void;
  removeStaff: (id: string) => void;
  saveBill: (bill: Omit<Bill, "id" | "number">) => Bill;
  nextBillNumber: number;
}

const TAX_RATE = 0.18;

const seedItems: Item[] = [
  { id: "i1", name: "Signature Cut & Blowdry", category: "Hair", price: 800, duration: 45 },
  { id: "i2", name: "Radiance Glow Facial", category: "Skin", price: 1500, duration: 60 },
  { id: "i3", name: "Gel Manicure", category: "Nails", price: 650, duration: 40 },
  { id: "i4", name: "Full-Color Hair Spa", category: "Hair", price: 1200, duration: 50 },
  { id: "i5", name: "Bridal Makeup", category: "Makeup", price: 9000, duration: 120 },
  { id: "i6", name: "Pedicure Deluxe", category: "Nails", price: 900, duration: 50 },
];

const seedStaff: StaffMember[] = [
  { id: "s1", name: "Riya S.", role: "Senior Stylist" },
  { id: "s2", name: "Meera Iyer", role: "Skin Specialist" },
  { id: "s3", name: "Aisha Khan", role: "Makeup Artist" },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() => load("gg-items", seedItems));
  const [staff, setStaff] = useState<StaffMember[]>(() => load("gg-staff", seedStaff));
  const [bills, setBills] = useState<Bill[]>(() => load("gg-bills", []));

  useEffect(() => localStorage.setItem("gg-items", JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem("gg-staff", JSON.stringify(staff)), [staff]);
  useEffect(() => localStorage.setItem("gg-bills", JSON.stringify(bills)), [bills]);

  const value = useMemo<StoreState>(() => {
    const nextBillNumber = bills.reduce((m, b) => Math.max(m, b.number), 140) + 1;
    return {
      items,
      staff,
      bills,
      nextBillNumber,
      addItem: (item) =>
        setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]),
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      addStaff: (s) =>
        setStaff((prev) => [...prev, { ...s, id: crypto.randomUUID() }]),
      removeStaff: (id) => setStaff((prev) => prev.filter((s) => s.id !== id)),
      saveBill: (bill) => {
        const full: Bill = {
          ...bill,
          id: crypto.randomUUID(),
          number: nextBillNumber,
        };
        setBills((prev) => [full, ...prev]);
        return full;
      },
    };
  }, [items, staff, bills]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function calcTotals(lines: BillLine[], discount: number) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax - discount;
  return { subtotal, tax, total };
}

export function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export const CATEGORY_STYLES: Record<
  ItemCategory,
  { card: string; chip: string; icon: string }
> = {
  Hair: { card: "bg-marigold-soft", chip: "bg-marigold text-plum", icon: "✂" },
  Skin: { card: "bg-coral-soft", chip: "bg-coral text-white", icon: "◍" },
  Nails: { card: "bg-teal-soft", chip: "bg-teal text-white", icon: "❋" },
  Makeup: { card: "bg-lilac-soft", chip: "bg-lilac text-plum", icon: "✿" },
  Other: { card: "bg-mint", chip: "bg-teal-soft text-plum", icon: "✦" },
};
