import type { Metadata } from "next";
import "./globals.css";
import "./toro.css";
import "./toro-workspace.css";

export const metadata: Metadata = {
  title: "TORO — Plánovač interiéru",
  description: "Navrhněte si pokoj ve 3D. Přizpůsobte místnost, rozmístěte skříně, vestavěný nábytek, botníky a police a dolaďte každý kus na míru.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/brand/toro-logo.png",
    shortcut: "/brand/toro-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
