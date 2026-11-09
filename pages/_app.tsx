import "@/styles/foundations.css";
import "@/styles/globals.css";
import "@/styles/sheet-bridge.css";
import "@/styles/form-workspace.css";
import "@/styles/dialog-workspace.css";
import "@/styles/bill-form.css";
import "@/styles/bill-refinement.css";
import "@/styles/neo-workspace.css";
import "@/styles/mercury-theme.css";
import "@/styles/mercury-overlays.css";
import "@/styles/palette.css";
import type { AppProps } from "next/app";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import GuideProvider from "@/components/guide/guide-provider";
import NeoProvider from "@/components/neo/provider";
import NeoShell from "@/components/neo/shell";
import NeoPanel from "@/components/neo";
import SheetDatePicker from "@/components/common/date-picker/sheet-date-picker";
import ErrorBoundary from "@/components/common/error-boundary";

// Neutral system sans-serif approximates Mercury’s Arcadia UI face.
// Source Serif 4 is Neo's reading voice (19 Oct 2026): its answers are set
// apart from the UI the way a chat assistant's are, in a text face built for
// long reading. The latin-ext cut is a second family only for ₹, which the
// latin cut lacks.
const sourceSerif = localFont({
  src: [
    {
      path: "../public/fonts/source-serif-4-latin-wght-normal.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../public/fonts/source-serif-4-latin-wght-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  display: "swap",
});
const sourceSerifExt = localFont({
  src: "../public/fonts/source-serif-4-latin-ext-wght-normal.woff2",
  weight: "200 900",
  display: "swap",
});

/**
 * PROTOTYPE STUB — mirrors pages/_app.tsx in aiaccountant-app.
 *
 * Production additionally mounts SessionProvider, QueryClientProvider,
 * EnvProvider, GuideProvider and the app-effects (AuthEffects, SetupGuard,
 * AppConfigPoller, AblyNotifications, UserCompaniesSync, BillingAccessGuard)
 * plus the global BulkUpload modal. None of those are needed to render a
 * screen, so they are omitted here.
 *
 * On handoff this file is DISCARDED — the real _app.tsx already provides the
 * font wrapper and the Toaster.
 */
export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style jsx global>{`
        :root {
          --font-family-primary:
            Arial, Helvetica, sans-serif, -apple-system, "Segoe UI", system-ui,
            sans-serif;
          --font-family-display: Arial, Helvetica, sans-serif;
          --font-family-mono: Arial, Helvetica, sans-serif;
          --font-family-reading:
            ${sourceSerif.style.fontFamily}, ${sourceSerifExt.style.fontFamily},
            Georgia, serif;
        }
      `}</style>
      {/* GuideProvider is mounted in production's _app.tsx too — a journey
          outlives the route it starts on, so it cannot live inside one. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey="aia-theme"
        disableTransitionOnChange
      >
        <GuideProvider>
          <NeoProvider>
            <NeoShell>
              <ErrorBoundary resetKey={router.asPath}>
                <Component {...pageProps} />
              </ErrorBoundary>
            </NeoShell>
            <NeoPanel />
          </NeoProvider>
        </GuideProvider>
        <Toaster position="bottom-right" closeButton />
        {/* The prototype's calendar for every native date input. */}
        <SheetDatePicker />
      </ThemeProvider>
    </div>
  );
}
