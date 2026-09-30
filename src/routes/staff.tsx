import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatINR } from "../lib/store";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff — Glow & Go Beauty Parlor Billing" },
      {
        name: "description",
        content: "Manage your parlor's team and see each member's billed totals.",
      },
      { property: "og:title", content: "Staff — Glow & Go Beauty Parlor Billing" },
      {
        property: "og:description",
        content: "Manage your parlor's team and see each member's billed totals.",
      },
    ],
  }),
  component: StaffPage,
});

const AVATAR_STYLES = [
  "bg-coral-soft text-coral",
  "bg-teal-soft text-teal",
  "bg-marigold-soft text-plum",
  "bg-lilac-soft text-plum",
];

function StaffPage() {
  const { staff, bills, addStaff, removeStaff } = useStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!name.trim()) return setError("Enter a staff name.");
    addStaff({ name: name.trim(), role: role.trim() || "Stylist" });
    setName("");
    setRole("");
    setError("");
  }

  function statsFor(id: string) {
    const mine = bills.filter((b) => b.staffId === id);
    return { count: mine.length, total: mine.reduce((s, b) => s + b.total, 0) };
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-14 lg:px-10">
      <div className="animate-fade-up mb-6">
        <h1 className="font-display text-5xl font-medium tracking-tight">Staff</h1>
        <p className="mt-2 text-foreground/55">
          Your team, and what each member has billed.
        </p>
      </div>

      <div className="animate-pop mb-8 rounded-[1.75rem] bg-card p-6 ring-1 ring-border">
        <div className="mb-4 font-display text-lg font-medium">Add a team member</div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 rounded-xl bg-blush px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (e.g. Senior Stylist)"
            className="flex-1 rounded-xl bg-blush px-3 py-2.5 text-sm ring-1 ring-border outline-none placeholder:text-foreground/40 focus:ring-coral"
          />
          <button
            onClick={handleAdd}
            className="rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white ring-1 ring-coral"
          >
            Add member
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-coral">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s, idx) => {
          const stats = statsFor(s.id);
          return (
            <div
              key={s.id}
              className="animate-pop rounded-[1.5rem] bg-card p-5 ring-1 ring-border"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid size-12 place-items-center rounded-full font-display text-lg font-medium ${AVATAR_STYLES[idx % AVATAR_STYLES.length]}`}
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-foreground/50">{s.role}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-foreground/15 pt-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-foreground/45">Bills</div>
                  <div className="font-medium">{stats.count}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-foreground/45">Billed</div>
                  <div className="font-medium">{formatINR(stats.total)}</div>
                </div>
                <button
                  onClick={() => removeStaff(s.id)}
                  className="rounded-full bg-blush px-4 py-2 text-sm font-medium text-foreground/60 ring-1 ring-border"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {staff.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-foreground/50">
            No staff yet — add your first team member above.
          </p>
        )}
      </div>
    </main>
  );
}
