# x402 TradingView Signal Bridge

TradingViewのPine Scriptアラートを受け取り、x402 Inc.のAPIスタックに自律決済しながら流すブリッジアプリです。

## アーキテクチャ

```
TradingView Pine Script
  ↓ webhook alert（JSON）
/api/webhook（このアプリ）
  ↓ BUYシグナルを解析
x402 Autonomous Agent スタック
  ├─ Whale Intent Decoder    $0.30 / call
  ├─ Divergence Analyzer     $0.15 / call
  └─ Copy Terminal           $0.10 / call（条件を満たした場合のみ）
```

執行条件：
- Whale Intent が `ACCUMULATION` または `POSITION_BUILDING`
- Whale Confidence ≥ 70%
- Divergence Score ≥ 0.5

## セットアップ

### 1. 環境変数

`.env.local` を作成：

```env
PAYMENT_PRIVATE_KEY=0x...   # Base mainnet に USDC を持つ EOA ウォレットの秘密鍵
WALLET_ADDRESS=0x...        # 受け取りウォレットアドレス
FACILITATOR_URL=https://api.developer.coinbase.com/rpc/v1/base/facilitator
WEBHOOK_SECRET=             # TradingView アラート認証用（任意）
```

### 2. インストール・起動

```bash
npm install
npm run dev
```

### 3. TradingView の設定

1. 以下の Pine Script をインジケーターとして追加する
2. チャート上でアラートを作成 → **Webhook URL** に `https://[デプロイURL]/api/webhook` を入力

#### Pine Script

```pine
//@version=6
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
```

## API エンドポイント

### `POST /api/webhook`

TradingView からのアラートを受け取るエンドポイント。BUY シグナルのみ処理します。

**リクエストボディ（TradingView が自動送信）：**
```json
{
  "ticker": "BTCUSDT",
  "action": "BUY",
  "price": 65000,
  "volume": 1234567,
  "exchange": "BINANCE"
}
```

**レスポンス例（執行あり）：**
```json
{
  "status": "ok",
  "results": {
    "whale": { "intent": "ACCUMULATION", "confidence": 0.85 },
    "divergence": { "divergenceScore": 0.72 },
    "execution": { "txHash": "0x...", "amountUsd": 10 },
    "executed": true
  }
}
```

### `GET /api/status`

ダッシュボード用。直近10件のシグナル処理ログを返します。

```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2025-01-01T00:00:00.000Z",
      "ticker": "BTCUSDT",
      "action": "BUY",
      "price": 65000,
      "status": "completed",
      "executed": true,
      "whale": { "intent": "ACCUMULATION", "confidence": 0.85 },
      "divergence": { "divergenceScore": 0.72 },
      "execution": { "txHash": "0x...", "amountUsd": 10 }
    }
  ]
}
```

## Vercel へのデプロイ

```bash
npm run build   # ビルド確認
```

1. [Vercel](https://vercel.com) にリポジトリを接続
2. Environment Variables に上記の環境変数を追加
3. デプロイ後、`https://[your-app].vercel.app/api/webhook` を TradingView の Webhook URL に設定

## 技術スタック

| パッケージ | バージョン | 用途 |
|---|---|---|
| Next.js | 15.5.9 | フレームワーク |
| React | 19.0.0 | UI |
| x402-fetch | 1.2.0 | x402 自律決済付きフェッチ |
| x402-next | 1.2.0 | Next.js x402 統合 |

## 注意事項

- `PAYMENT_PRIVATE_KEY` に設定するウォレットには Base mainnet の USDC が必要です
- ログはメモリ内に保持されるため、サーバー再起動でリセットされます
- Vercel のサーバーレス環境ではコールドスタート後にログが消えます。永続化が必要な場合はデータベースを追加してください
