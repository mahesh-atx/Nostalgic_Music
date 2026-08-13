import type { Metadata } from "next";
import { Inter, Yatra_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const yatraOne = Yatra_One({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-yatra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "डीलक्स ढाबा — Dhaba Music Player",
  description:
    "डीलक्स ढाबा — a retro Bollywood music player that runs fullscreen in the shop. 90s punjabi tunes on tap, straight from the dhaba playlist, with a live IST clock and cover art for every song.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className={`${inter.variable} ${yatraOne.variable}`}>
      <body>{children}</body>
    </html>
  );
}