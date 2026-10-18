import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ScopeShield — Protect your scope", description: "Deterministic contract-aware request analysis." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
