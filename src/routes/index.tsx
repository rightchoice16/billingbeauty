import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glow & Go — Multi-branch Beauty Parlor Billing" },
      { name: "description", content: "Branch billing, reports and accounts for your beauty parlor." },
      { property: "og:title", content: "Glow & Go — Multi-branch Beauty Parlor Billing" },
      { property: "og:description", content: "Branch billing, reports and accounts for your beauty parlor." },
    ],
  }),
  component: () => (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-4xl font-medium">Multi-branch billing is being set up</h1>
      <p className="mt-3 text-foreground/60">Branch logins, reports and thermal receipts are coming in the next update.</p>
    </main>
  ),
});
