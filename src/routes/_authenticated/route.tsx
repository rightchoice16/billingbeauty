import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranches, useMe } from "@/lib/me";
import { BranchContext } from "@/lib/branch-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

const navCls =
  "shrink-0 rounded-full bg-card px-5 py-2.5 text-sm font-medium text-foreground/70 ring-1 ring-border";
const activeCls =
  "shrink-0 rounded-full bg-plum text-lilac-soft text-sm font-medium px-5 py-2.5 ring-1 ring-plum";

function Layout() {
  const me = useMe();
  const isAdmin = !!me.data?.isAdmin;
  const branchesQ = useBranches();
  const branches = isAdmin ? branchesQ.data ?? [] : me.data?.branch ? [me.data.branch] : [];
  const [selId, setSelId] = useState<string | null>(null);
  useEffect(() => {
    setSelId(localStorage.getItem("gg-admin-branch"));
  }, []);
  const branch = isAdmin
    ? branches.find((b) => b.id === selId) ?? branches[0] ?? null
    : me.data?.branch ?? null;
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/bill", label: "New bill" },
    { to: "/history", label: "Bill history" },
    { to: "/reports", label: "Reports" },
    { to: "/items", label: "Services" },
    { to: "/staff", label: "Staff" },
    ...(isAdmin ? [{ to: "/branches", label: "Branches & accounts" }] : []),
  ] as const;

  if (me.isLoading) return <p className="px-10 py-10 text-foreground/50">Loading…</p>;

  return (
    <BranchContext.Provider
      value={{
        isAdmin,
        branch,
        branches,
        setBranchId: (id) => {
          localStorage.setItem("gg-admin-branch", id);
          setSelId(id);
        },
      }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-6 py-4 lg:px-10">
        <nav className="flex flex-1 gap-3 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={navCls} activeProps={{ className: activeCls }}>
              {n.label}
            </Link>
          ))}
        </nav>
        {isAdmin && branches.length > 0 && (
          <select
            value={branch?.id ?? ""}
            onChange={(e) => {
              localStorage.setItem("gg-admin-branch", e.target.value);
              setSelId(e.target.value);
            }}
            className="rounded-full bg-card px-4 py-2.5 text-sm ring-1 ring-border"
            aria-label="Active branch"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <span className="text-sm text-foreground/50">
          {isAdmin ? "Admin" : me.data?.branch?.name}
        </span>
        <button onClick={signOut} className={navCls}>
          Sign out
        </button>
      </div>
      <Outlet />
    </BranchContext.Provider>
  );
}
