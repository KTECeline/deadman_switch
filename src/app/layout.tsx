import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SwitchesProvider } from "@/lib/switches-store";
import WalletProvider from "@/components/WalletProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dead Man's Switch — Protect Your Crypto",
  description:
    "AI-powered autonomous inheritance on Solana. Create emergency instructions that execute automatically if something happens to you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <WalletProvider>
          <SwitchesProvider>{children}</SwitchesProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
