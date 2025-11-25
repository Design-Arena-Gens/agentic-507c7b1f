'use client';

import { useMemo } from 'react';
import { CandleData } from '@/lib/types';

interface OrderBookProps {
  candles: CandleData[];
}

function createOrderBook(candles: CandleData[]) {
  const latest = candles.at(-1);
  if (!latest) return { bids: [], asks: [] } as const;

  const mid = latest.close;
  const bids = Array.from({ length: 10 }).map((_, index) => {
    const price = mid - (index + 1) * mid * 0.0015;
    const size = Math.abs(Math.sin(price)) * latest.volume * 0.03;
    return { price, size };
  });

  const asks = Array.from({ length: 10 }).map((_, index) => {
    const price = mid + (index + 1) * mid * 0.0015;
    const size = Math.abs(Math.cos(price)) * latest.volume * 0.03;
    return { price, size };
  });

  return { bids, asks } as const;
}

export function OrderBook({ candles }: OrderBookProps) {
  const { bids, asks } = useMemo(() => createOrderBook(candles), [candles]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/60 bg-slate-900/80">
      <div className="border-b border-slate-800/60 px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-200">Synthetic Order Book</h3>
      </div>
      <div className="grid flex-1 grid-cols-2 divide-x divide-slate-800/60 text-xs">
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 text-slate-400">
            <span>Bid</span>
            <span>Size</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {bids.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between rounded bg-emerald-500/10 px-2 py-1 text-emerald-300">
                <span>{row.price.toFixed(2)}</span>
                <span>{row.size.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 text-slate-400">
            <span>Ask</span>
            <span>Size</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {asks.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between rounded bg-rose-500/10 px-2 py-1 text-rose-300">
                <span>{row.price.toFixed(2)}</span>
                <span>{row.size.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
