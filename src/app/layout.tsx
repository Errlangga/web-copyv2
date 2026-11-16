import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CopyVault — Text Archive",
  description: "A curated archive of text, templates, and digital notes.",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}