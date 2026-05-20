import { wrapFetchWithPayment, createSigner } from "x402-fetch";
import { addLog } from "@/lib/store";

interface TradingViewSignal {
  ticker: string;
  action: string;
  price: number;
  volume: number;
  exchange: string;
}

export async function POST(req: Request) {
  const signal: TradingViewSignal = await req.json();

  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ticker: signal.ticker,
    action: signal.action,
    price: signal.price,
    status: "processing",
    executed: false,
  };

  if (signal.action !== "BUY") {
    const skippedLog = { ...logEntry, status: "skipped" };
    addLog(skippedLog);
    return Response.json({ status: "skipped", reason: "not a BUY signal" });
  }

  try {
    const results = await processSignal(signal);
    const completedLog = {
      ...logEntry,
      status: "completed",
      executed: results.executed,
      whale: results.whale,
      divergence: results.divergence,
      execution: results.execution,
    };
    addLog(completedLog);
    return Response.json({ status: "ok", results });
  } catch (error) {
    const errorLog = { ...logEntry, status: "error" };
    addLog(errorLog);
    return Response.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}

async function processSignal(signal: TradingViewSignal) {
  const privateKey = process.env.PAYMENT_PRIVATE_KEY as `0x${string}`;
  const signer = await createSigner("base-mainnet", privateKey);
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

  const whaleRes = await fetchWithPayment(
    "https://x402wid.vercel.app/api/decode",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: signal.ticker, chain: "base" }),
    }
  );
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
    const executeRes = await fetchWithPayment(
      "https://x402smct.vercel.app/api/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: signal.ticker,
          chain: "base",
          amountUsd: 10,
        }),
      }
    );
    const execution = await executeRes.json();
    return { whale, divergence, execution, executed: true };
  }

  return { whale, divergence, executed: false };
}
