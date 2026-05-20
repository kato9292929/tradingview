import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "x402 TradingView Signal Bridge",
  description: "TradingViewのシグナルをx402 APIスタックに流す",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
