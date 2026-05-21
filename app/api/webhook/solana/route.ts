import { NextResponse } from "next/server";
import { createSigner, wrapFetchWithPayment } from "x402-fetch";
import { addLog } from "@/lib/store";

export const dynamic = "force-dynamic";

const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const PRICE_USDC = "100000"; // $0.10 in USDC (6 decimals)

interface TradingViewSignal {
  ticker: string;
  action: string;
  price: number;
  volume: number;
  exchange: string;
}

type PaymentFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

let cachedFetch: PaymentFetch | null = null;

async function getPaymentFetch(): Promise<PaymentFetch> {
  if (cachedFetch) return cachedFetch;
  const privateKey = process.env.PAYMENT_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) throw new Error("PAYMENT_PRIVATE_KEY not set");
  const signer = await createSigner("base", privateKey);
  cachedFetch = wrapFetchWithPayment(
    globalThis.fetch,
    signer,
    BigInt(1_000_000)
  );
  return cachedFetch;
}

export async function POST(req: Request) {
  const paymentHeader = req.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return new NextResponse(
      JSON.stringify({
        error: "Payment Required",
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "solana",
            maxAmountRequired: PRICE_USDC,
            resource: `${appUrl}/api/webhook/solana`,
            description: "TradingView Signal Processing - Solana",
            mimeType: "application/json",
            payTo: process.env.SOLANA_WALLET_ADDRESS ?? "",
            maxTimeoutSeconds: 300,
            asset: SOLANA_USDC,
          },
        ],
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "x-payment, content-type",
        },
      }
    );
  }

  const signal: TradingViewSignal = await req.json();

  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ticker: signal.ticker,
    action: signal.action,
    price: signal.price,
    status: "processing",
    executed: false,
    chain: "solana" as const,
  };

  if (signal.action !== "BUY") {
    addLog({ ...logEntry, status: "skipped" });
    return NextResponse.json({ status: "skipped", reason: "not a BUY signal" });
  }

  try {
    const results = await processSignal(signal);
    addLog({
      ...logEntry,
      status: "completed",
      executed: results.executed,
      whale: results.whale,
      divergence: results.divergence,
      execution: results.execution,
    });
    return NextResponse.json({ status: "ok", results });
  } catch (error) {
    addLog({ ...logEntry, status: "error" });
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "x-payment, content-type",
    },
  });
}

async function processSignal(signal: TradingViewSignal) {
  const fetchWithPayment = await getPaymentFetch();

  const whaleRes = await fetchWithPayment("https://x402wid.vercel.app/api/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: signal.ticker, chain: "base" }),
  });
  const whale = await whaleRes.json();

  const divergenceRes = await fetchWithPayment(
    "https://x402nansenpolymarket.vercel.app/api/divergence/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: signal.ticker, chain: "base" }),
    }
  );
  const divergence = await divergenceRes.json();

  const shouldExecute =
    ["ACCUMULATION", "POSITION_BUILDING"].includes(whale.intent) &&
    whale.confidence >= 0.7 &&
    divergence.divergenceScore >= 0.5;

  if (shouldExecute) {
    const executeRes = await fetchWithPayment("https://x402smct.vercel.app/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: signal.ticker, chain: "base", amountUsd: 10 }),
    });
    const execution = await executeRes.json();
    return { whale, divergence, execution, executed: true };
  }

  return { whale, divergence, executed: false };
}
