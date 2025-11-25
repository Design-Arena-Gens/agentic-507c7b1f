'use client';

import { CHART_TYPES, TIMEFRAMES } from '@/lib/symbols';
import { ChartType, Timeframe } from '@/lib/types';

interface ChartControlsProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  chartType: ChartType;
  onChartTypeChange: (chartType: ChartType) => void;
  onRefresh: () => void;
}

export function ChartControls({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  onRefresh,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/60 bg-slate-900/80 p-3">
      <div className="flex items-center gap-2">
        {TIMEFRAMES.map((item) => {
          const isActive = item.value === timeframe;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTimeframeChange(item.value)}
              className={`rounded-lg px-3 py-1 text-sm transition ${
                isActive ? 'bg-accent text-slate-900 font-semibold' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {CHART_TYPES.map((item) => {
          const isActive = item.value === chartType;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChartTypeChange(item.value)}
              className={`rounded-lg px-3 py-1 text-sm transition ${
                isActive ? 'bg-accent text-slate-900 font-semibold' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg bg-slate-800/90 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-700/80 hover:text-white"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
