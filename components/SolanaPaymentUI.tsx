"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function SolanaPaymentUI() {
  const { connected, publicKey } = useWallet();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <WalletMultiButton
        style={{
          background: "#1a1a1a",
          border: "1px solid #9945FF44",
          borderRadius: "8px",
          color: "#c8a96e",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.8rem",
          height: "36px",
          padding: "0 1rem",
        }}
      />
      {connected && publicKey && (
        <span
          style={{
            color: "#9945FF",
            fontSize: "0.75rem",
            background: "#9945FF11",
            border: "1px solid #9945FF33",
            borderRadius: "6px",
            padding: "0.25rem 0.6rem",
          }}
        >
          {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
        </span>
      )}
    </div>
  );
}
