import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nocturne999 — Temukan prompt gratis disini",
  description: "Nocturne999 — arsip prompt dan teks pilihan.",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
