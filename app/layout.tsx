import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";
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
      <head>
        {/* Sets initial data-theme before hydration to prevent FOUC (ADR-0013 §6). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
