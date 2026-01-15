import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Penempatan Lulusan STIS D3",
  description:
    "Visualisasi interaktif penempatan lulusan STIS D3 Angkatan 63 & 64 per provinsi di Indonesia",
  keywords: [
    "STIS",
    "BPS",
    "penempatan",
    "lulusan",
    "dashboard",
    "peta Indonesia",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
