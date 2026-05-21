export interface SignalLog {
  id: string;
  timestamp: string;
  ticker: string;
  action: string;
  price: number;
  status: string;
  executed: boolean;
  chain?: "base" | "solana";
  whale?: {
    intent: string;
    confidence: number;
  };
  divergence?: {
    divergenceScore: number;
  };
  execution?: {
    txHash?: string;
    amountUsd?: number;
  };
}

const MAX_LOGS = 10;

// Module-level in-memory store (persists across requests in same process)
const logs: SignalLog[] = [];

export function addLog(log: SignalLog): void {
  logs.unshift(log);
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }
}

export function getLogs(): SignalLog[] {
  return [...logs];
}
