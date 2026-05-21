"use client";
import dynamic from "next/dynamic";

const SolanaWalletProviders = dynamic(
  () => import("./SolanaWalletProviders"),
  { ssr: false }
);

export default function SolanaContextBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SolanaWalletProviders>{children}</SolanaWalletProviders>;
}
