import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glow & Go — Multi-branch Beauty Parlor Billing" },
      { name: "description", content: "Branch billing, reports and accounts for your beauty parlor." },
      { property: "og:title", content: "Glow & Go — Multi-branch Beauty Parlor Billing" },
      { property: "og:description", content: "Branch billing, reports and accounts for your beauty parlor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) =>
      navigate({ to: data.session ? "/bill" : "/auth", replace: true }),
    );
  }, [navigate]);
  return <p className="px-10 py-16 text-center text-foreground/50">Opening…</p>;
}
