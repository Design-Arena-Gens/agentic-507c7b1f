'use client';

import { useMemo } from 'react';
import { CandleData } from '@/lib/types';

interface IndicatorPanelProps {
  candles: CandleData[];
}

function movingAverage(data: CandleData[], length: number) {
  if (data.length < length) return null;
  const slice = data.slice(-length);
  const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
  return sum / length;
}

function rsi(data: CandleData[], period = 14) {
  if (data.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let index = data.length - period; index < data.length; index += 1) {
    const current = data[index];
    const previous = data[index - 1];
    if (!current || !previous) continue;
    const diff = current.close - previous.close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function macd(data: CandleData[]) {
  if (data.length < 35) return null;

  const ema = (length: number) => {
    const k = 2 / (length + 1);
    let prevEma = data[0].close;
    for (let i = 1; i < data.length; i += 1) {
      const price = data[i].close;
      prevEma = price * k + prevEma * (1 - k);
    }
    return prevEma;
  };

  const fast = ema(12);
  const slow = ema(26);
  const macdValue = fast - slow;
  const signal = macdValue * 0.8;

  return {
    macd: macdValue,
    signal,
    histogram: macdValue - signal,
  };
}

export function IndicatorPanel({ candles }: IndicatorPanelProps) {
  const indicators = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    return {
      ma20: movingAverage(candles, 20),
      ma50: movingAverage(candles, 50),
      ma200: movingAverage(candles, 200),
      rsi: rsi(candles),
      macd: macd(candles),
    };
  }, [candles]);

  return (
    <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-800/60 bg-slate-900/80 p-4">
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400">MA 20</h4>
        <p className="text-lg font-semibold text-slate-100">
          {indicators?.ma20 ? indicators.ma20.toFixed(3) : '—'}
        </p>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400">MA 50</h4>
        <p className="text-lg font-semibold text-slate-100">
          {indicators?.ma50 ? indicators.ma50.toFixed(3) : '—'}
        </p>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400">MA 200</h4>
        <p className="text-lg font-semibold text-slate-100">
          {indicators?.ma200 ? indicators.ma200.toFixed(3) : '—'}
        </p>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400">RSI</h4>
        <p className="text-lg font-semibold text-slate-100">{indicators?.rsi ? indicators.rsi.toFixed(2) : '—'}</p>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400">MACD</h4>
        <p className="text-lg font-semibold text-slate-100">{indicators?.macd?.macd?.toFixed(3) ?? '—'}</p>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-wider text-slate-400">Signal</h4>
        <p className="text-lg font-semibold text-slate-100">{indicators?.macd?.signal?.toFixed(3) ?? '—'}</p>
        <p className={`text-xs ${indicators?.macd?.histogram && indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          Hist: {indicators?.macd?.histogram?.toFixed(3) ?? '—'}
        </p>
      </div>
    </div>
  );
}
