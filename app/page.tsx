"use client";

import { useState, useEffect, useCallback } from "react";

interface SignalLog {
  id: string;
  timestamp: string;
  ticker: string;
  action: string;
  price: number;
  status: string;
  executed: boolean;
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

export default function Home() {
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook`);
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      padding: "2rem",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem", borderBottom: "1px solid #1e1e1e", paddingBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: "#c8a96e", boxShadow: "0 0 8px #c8a96e"
            }} />
            <span style={{ color: "#c8a96e", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              x402 Protocol
            </span>
          </div>
          <h1 style={{
            fontSize: "2.25rem",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "0.4rem",
            letterSpacing: "-0.02em"
          }}>
            x402 TradingView Signal Bridge
          </h1>
          <p style={{ color: "#888", fontSize: "1rem", fontWeight: 300 }}>
            TradingViewのシグナルをx402 APIスタックに流す
          </p>
        </div>

        {/* Webhook URL */}
        <div style={{
          background: "#111111",
          border: "1px solid #222",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ color: "#c8a96e", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Webhook URL
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{
              flex: 1,
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              color: "#e0e0e0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {webhookUrl || "Loading..."}
            </div>
            <button
              onClick={copyWebhookUrl}
              style={{
                background: copied ? "#1a3a1a" : "#1a1a1a",
                border: `1px solid ${copied ? "#2a6a2a" : "#333"}`,
                borderRadius: "8px",
                padding: "0.75rem 1.25rem",
                color: copied ? "#4ade80" : "#c8a96e",
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            このURLをTradingViewのアラート設定 → Webhook URLに設定してください
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Whale Intent Decoder", price: "$0.30", color: "#c8a96e" },
            { label: "Divergence Analyzer", price: "$0.15", color: "#8ba4d4" },
            { label: "Copy Terminal", price: "$0.10", color: "#7ec8a0" },
          ].map((api) => (
            <div key={api.label} style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "12px",
              padding: "1.25rem",
            }}>
              <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.4rem", fontWeight: 500 }}>{api.label}</div>
              <div style={{ color: api.color, fontSize: "1.5rem", fontWeight: 700 }}>{api.price}</div>
              <div style={{ color: "#444", fontSize: "0.7rem", marginTop: "0.25rem" }}>per request via x402</div>
            </div>
          ))}
        </div>

        {/* Signal Logs */}
        <div style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #1e1e1e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <span style={{ color: "#c8a96e", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Signal Log
              </span>
              <span style={{ color: "#444", fontSize: "0.75rem", marginLeft: "0.75rem" }}>最新10件</span>
            </div>
            <button
              onClick={fetchLogs}
              style={{
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                padding: "0.4rem 0.75rem",
                color: "#666",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#444" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.3 }}>📡</div>
              <div style={{ fontSize: "0.9rem" }}>TradingViewからのシグナル待ち...</div>
              <div style={{ fontSize: "0.75rem", color: "#333", marginTop: "0.5rem" }}>Webhookを設定してアラートを送信してください</div>
            </div>
          ) : (
            <div>
              {logs.map((log) => (
                <div key={log.id} style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #161616",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "1rem",
                  alignItems: "start"
                }}>
                  {/* Left: action badge + ticker */}
                  <div>
                    <span style={{
                      display: "inline-block",
                      background: log.action === "BUY" ? "#1a3a1a" : "#3a1a1a",
                      color: log.action === "BUY" ? "#4ade80" : "#f87171",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem"
                    }}>
                      {log.action}
                    </span>
                    <div style={{ color: "#ffffff", fontSize: "0.95rem", fontWeight: 600 }}>{log.ticker}</div>
                    <div style={{ color: "#555", fontSize: "0.75rem" }}>${log.price?.toLocaleString()}</div>
                  </div>

                  {/* Middle: analysis results */}
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {log.whale && (
                      <div style={{
                        background: "#0d0d0d",
                        border: "1px solid #1e1e1e",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem",
                        minWidth: "140px"
                      }}>
                        <div style={{ color: "#c8a96e", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "0.2rem" }}>WHALE INTENT</div>
                        <div style={{ color: "#e0e0e0", fontSize: "0.8rem", fontWeight: 500 }}>{log.whale.intent}</div>
                        <div style={{ color: "#666", fontSize: "0.7rem" }}>conf: {(log.whale.confidence * 100).toFixed(0)}%</div>
                      </div>
                    )}
                    {log.divergence && (
                      <div style={{
                        background: "#0d0d0d",
                        border: "1px solid #1e1e1e",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem",
                        minWidth: "140px"
                      }}>
                        <div style={{ color: "#8ba4d4", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "0.2rem" }}>DIVERGENCE</div>
                        <div style={{ color: "#e0e0e0", fontSize: "0.8rem", fontWeight: 500 }}>Score: {log.divergence.divergenceScore?.toFixed(2)}</div>
                        <div style={{ color: "#666", fontSize: "0.7rem" }}>
                          {log.divergence.divergenceScore >= 0.5 ? "Significant" : "Low"}
                        </div>
                      </div>
                    )}
                    {log.execution && (
                      <div style={{
                        background: "#0d1a0d",
                        border: "1px solid #1e2e1e",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem",
                        minWidth: "140px"
                      }}>
                        <div style={{ color: "#7ec8a0", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "0.2rem" }}>EXECUTED</div>
                        <div style={{ color: "#e0e0e0", fontSize: "0.8rem", fontWeight: 500 }}>${log.execution.amountUsd}</div>
                        {log.execution.txHash && (
                          <div style={{ color: "#666", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {log.execution.txHash.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                    )}
                    {!log.whale && !log.divergence && (
                      <div style={{ color: "#444", fontSize: "0.8rem", alignSelf: "center" }}>
                        {log.status === "skipped" ? "SELL signal — skipped" : "Processing..."}
                      </div>
                    )}
                  </div>

                  {/* Right: timestamp + executed badge */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#444", fontSize: "0.7rem", marginBottom: "0.4rem" }}>
                      {new Date(log.timestamp).toLocaleTimeString("ja-JP")}
                    </div>
                    {log.executed !== undefined && (
                      <span style={{
                        display: "inline-block",
                        background: log.executed ? "#1a3a2a" : "#1a1a1a",
                        color: log.executed ? "#7ec8a0" : "#555",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        letterSpacing: "0.05em"
                      }}>
                        {log.executed ? "EXECUTED" : "NOT EXECUTED"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pine Script section */}
        <div style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          padding: "1.5rem",
          marginTop: "2rem"
        }}>
          <div style={{ color: "#c8a96e", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
            TradingView Pine Script
          </div>
          <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "1rem" }}>
            以下のスクリプトをTradingViewに追加し、アラートのWebhook URLにこのページのURLを設定してください。
          </p>
          <div style={{
            background: "#0a0a0a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            padding: "1rem",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: "#888",
            whiteSpace: "pre",
            overflowX: "auto",
            lineHeight: "1.6"
          }}>
{`//@version=6
indicator("x402 Signal Bridge", overlay=true)

fast_length = input.int(9, "Fast EMA")
slow_length = input.int(21, "Slow EMA")

fast_ema = ta.ema(close, fast_length)
slow_ema = ta.ema(close, slow_length)

bullish_cross = ta.crossover(fast_ema, slow_ema)
bearish_cross = ta.crossunder(fast_ema, slow_ema)

plot(fast_ema, "Fast EMA", color=color.new(#c8a96e, 0), linewidth=2)
plot(slow_ema, "Slow EMA", color=color.new(#ffffff, 50), linewidth=1)

alertcondition(bullish_cross, "BUY Signal",
  '{"ticker": "{{ticker}}", "action": "BUY", "price": {{close}}, "volume": {{volume}}, "exchange": "{{exchange}}"}')
alertcondition(bearish_cross, "SELL Signal",
  '{"ticker": "{{ticker}}", "action": "SELL", "price": {{close}}, "volume": {{volume}}, "exchange": "{{exchange}}"}')
`}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "2rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ color: "#333", fontSize: "0.75rem" }}>x402 TradingView Signal Bridge</span>
          <span style={{ color: "#333", fontSize: "0.75rem" }}>Powered by x402 Protocol</span>
        </div>
      </div>
    </main>
  );
}
