import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "डीलक्स ढाबा — Dhaba Music Player",
  description:
    "डीलक्स ढाबा का ऑनलाइन म्यूज़िक प्लेयर — punjabi tunes on tap, straight from the dhaba playlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}