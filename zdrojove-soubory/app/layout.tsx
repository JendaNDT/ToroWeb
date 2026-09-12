import type { Metadata } from "next";
import "./globals.css";
import "./toro.css";
import "./toro-workspace.css";

export const metadata: Metadata = {
  title: "TORO — Plánovač interiéru",
  description: "Navrhněte si jeden kus nábytku nebo celý pokoj ve 3D. Dolaďte všech 15 druhů, rozměry, materiály a vybavení a připravte podklady pro TORO.",
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
