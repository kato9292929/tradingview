export const dynamic = "force-dynamic";

const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const solanaWallet = process.env.SOLANA_WALLET_ADDRESS ?? "";

  return Response.json({
    version: 1,
    resources: [
      {
        path: "/api/webhook",
        method: "POST",
        description: "TradingView Signal Processing (Base - no payment required)",
        accepts: [],
      },
      {
        path: "/api/webhook/solana",
        method: "POST",
        description: "TradingView Signal Processing (Solana USDC)",
        accepts: [
          {
            scheme: "exact",
            network: "solana",
            maxAmountRequired: "100000",
            resource: `${appUrl}/api/webhook/solana`,
            description: "TradingView Signal Processing - Solana",
            mimeType: "application/json",
            payTo: solanaWallet,
            maxTimeoutSeconds: 300,
            asset: SOLANA_USDC,
          },
        ],
      },
    ],
  });
}
