import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { usernameToEmail } from "./billing";

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,30}$/, "Login ID: 3–30 letters, numbers, dot, dash or underscore");
const password = z.string().min(6, "Password must be at least 6 characters").max(72);

async function getAdmin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const a = await getAdmin();
  const { count } = await a
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

export const setupAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ username, password }).parse(d))
  .handler(async ({ data }) => {
    const a = await getAdmin();
    const { count } = await a
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Admin account already exists");
    const { data: u, error } = await a.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
    });
    if (error || !u.user) throw new Error(error?.message ?? "Could not create admin");
    await a.from("user_roles").insert({ user_id: u.user.id, role: "admin" });
    return { ok: true };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Only the admin can do this");
}

export const createBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        address: z.string().trim().max(300),
        phone: z.string().trim().max(20),
        upiId: z.string().trim().max(100),
        logoUrl: z.string().max(400_000).nullable(),
        username,
        password,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const a = await getAdmin();
    const { data: u, error } = await a.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
    });
    if (error || !u.user)
      throw new Error(
        error?.message?.includes("already") ? "That login ID is taken" : error?.message ?? "Failed",
      );
    const { data: branch, error: bErr } = await a
      .from("branches")
      .insert({
        name: data.name,
        address: data.address,
        phone: data.phone,
        upi_id: data.upiId,
        logo_url: data.logoUrl,
        username: data.username,
        user_id: u.user.id,
      })
      .select()
      .single();
    if (bErr || !branch) {
      await a.auth.admin.deleteUser(u.user.id);
      throw new Error(bErr?.message ?? "Failed to create branch");
    }
    await a.from("user_roles").insert({ user_id: u.user.id, role: "branch" });
    await a.from("items").insert([
      { branch_id: branch.id, name: "Signature Cut & Blowdry", category: "Hair", price: 800, duration: 45 },
      { branch_id: branch.id, name: "Radiance Glow Facial", category: "Skin", price: 1500, duration: 60 },
      { branch_id: branch.id, name: "Gel Manicure", category: "Nails", price: 650, duration: 40 },
      { branch_id: branch.id, name: "Bridal Makeup", category: "Makeup", price: 9000, duration: 120 },
    ]);
    return { id: branch.id };
  });

export const resetBranchPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ branchId: z.string().uuid(), password }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const a = await getAdmin();
    const { data: b } = await a.from("branches").select("user_id").eq("id", data.branchId).single();
    if (!b?.user_id) throw new Error("Branch not found");
    const { error } = await a.auth.admin.updateUserById(b.user_id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ branchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const a = await getAdmin();
    const { data: b } = await a.from("branches").select("user_id").eq("id", data.branchId).single();
    await a.from("branches").delete().eq("id", data.branchId);
    if (b?.user_id) await a.auth.admin.deleteUser(b.user_id);
    return { ok: true };
  });
