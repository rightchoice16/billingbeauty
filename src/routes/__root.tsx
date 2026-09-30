import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "../lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-card px-5 py-2.5 text-sm font-medium text-foreground ring-1 ring-border"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Glow & Go — Beauty Parlor Billing" },
      {
        name: "description",
        content:
          "Billing software for beauty parlors: create services with prices, build bills with customer and staff details, and track bill history.",
      },
      { property: "og:title", content: "Glow & Go — Beauty Parlor Billing" },
      {
        property: "og:description",
        content:
          "Create items, build bills with customer and staff details, and print receipts for your beauty parlor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=DM+Sans:opsz,wght@9..40,400..600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "New bill" },
  { to: "/items", label: "Items & services" },
  { to: "/history", label: "Bill history" },
  { to: "/staff", label: "Staff" },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <div className="min-h-screen bg-background text-foreground">
          <header className="mx-auto flex max-w-[1440px] items-center justify-between px-6 pt-6 pb-2 lg:px-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-plum font-display text-xl text-marigold">
                ✦
              </div>
              <div className="leading-none">
                <div className="font-display text-2xl font-medium tracking-tight">
                  Glow &amp; Go
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">
                  Beauty parlor billing
                </div>
              </div>
            </Link>
            <div className="hidden items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm ring-1 ring-border sm:flex">
              <span className="size-2 rounded-full bg-teal" /> Counter open · 9:00–7:00
            </div>
          </header>

          <nav className="mx-auto flex max-w-[1440px] gap-3 overflow-x-auto px-6 py-6 lg:px-10">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="shrink-0 rounded-full bg-card px-5 py-2.5 text-sm font-medium text-foreground/70 ring-1 ring-border"
                activeProps={{ className: "shrink-0 rounded-full bg-plum text-lilac-soft text-sm font-medium px-5 py-2.5 ring-1 ring-plum" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <Outlet />
        </div>
      </StoreProvider>
    </QueryClientProvider>
  );
}
