import type { Metadata } from "next";
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
    <html lang="es" suppressHydrationWarning>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
