import type { Metadata } from "next";
import Script from "next/script";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Providers } from "./providers";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { TorchlightCursor } from "@/components/effects/torchlight-cursor";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "wizard-hub — Tu portal al mundo de Hogwarts",
    template: "%s · wizard-hub",
  },
  description:
    "Web app del fanclub de Harry Potter. Guía a nuevos miembros dentro del mundo de Hogwarts.",
  metadataBase: new URL("https://wizard-hub.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body className="font-body antialiased">
        {/* Sets initial data-theme before hydration to prevent FOUC (ADR-0013 §6). */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Providers>
          <TorchlightCursor />
          <Nav />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
