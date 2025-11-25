'use client';

import { useMemo } from 'react';
import { CandleData } from '@/lib/types';

interface SymbolOverviewProps {
  symbol: string;
  candles: CandleData[];
}

function formatNumber(value?: number, fractionDigits = 2) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
}

export function SymbolOverview({ symbol, candles }: SymbolOverviewProps) {
  const metrics = useMemo(() => {
    if (!candles || candles.length === 0) {
      return null;
    }

    const latest = candles.at(-1);
    const first = candles[0];
    if (!latest || !first) return null;

    const change = latest.close - first.open;
    const changePercent = (change / first.open) * 100;
    const high = Math.max(...candles.map((candle) => candle.high));
    const low = Math.min(...candles.map((candle) => candle.low));
    const volume = candles.reduce((acc, candle) => acc + candle.volume, 0);

    return {
      latest,
      change,
      changePercent,
      high,
      low,
      volume,
    };
  }, [candles]);

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800/60 bg-slate-900/80 p-4">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-400">Symbol</h3>
        <p className="text-lg font-semibold text-slate-100">{symbol}</p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-400">Last Price</h3>
        <p className="text-lg font-semibold text-slate-100">
          {metrics ? formatNumber(metrics.latest.close, 4) : '—'}
        </p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-400">Change</h3>
        <p className={`text-lg font-semibold ${metrics && metrics.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {metrics ? `${metrics.change >= 0 ? '+' : ''}${formatNumber(metrics.change, 3)}` : '—'}
        </p>
        <p className="text-xs text-slate-400">
          {metrics ? `${metrics.changePercent >= 0 ? '+' : ''}${metrics.changePercent.toFixed(2)}%` : ''}
        </p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-400">24h Range</h3>
        <p className="text-sm text-slate-200">
          {metrics ? `${formatNumber(metrics.low, 4)} – ${formatNumber(metrics.high, 4)}` : '—'}
        </p>
      </div>
      <div className="col-span-2">
        <h3 className="text-xs uppercase tracking-wider text-slate-400">Volume</h3>
        <p className="text-sm text-slate-200">{metrics ? formatNumber(metrics.volume, 2) : '—'}</p>
      </div>
    </div>
  );
}
