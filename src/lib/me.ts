import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Branch } from "./billing";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const [{ data: roles }, { data: branch }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("branches").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      return {
        user,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
        branch: (branch as Branch | null) ?? null,
      };
    },
  });
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*").order("created_at");
      if (error) throw error;
      return data as Branch[];
    },
  });
}
