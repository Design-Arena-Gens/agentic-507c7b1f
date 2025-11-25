'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { ChartControls } from '@/components/controls/ChartControls';
import { DrawingToolbar } from '@/components/chart/DrawingToolbar';
import { OrderBook } from '@/components/market/OrderBook';
import { Watchlist } from '@/components/market/Watchlist';
import { SymbolOverview } from '@/components/market/SymbolOverview';
import { IndicatorPanel } from '@/components/indicators/IndicatorPanel';
import { TopBar } from '@/components/layout/TopBar';
import { loadCandles } from '@/lib/api';
import { useChartStore } from '@/store/chartStore';

const TradingChart = dynamic(() => import('@/components/chart/TradingChart').then((mod) => mod.TradingChart), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-slate-400">Loading chart...</div>
  ),
});

export default function Page() {
  const {
    symbol,
    timeframe,
    chartType,
    drawings,
    activeTool,
    theme,
    setSymbol,
    setTimeframe,
    setChartType,
    setActiveTool,
    toggleTheme,
    addDrawing,
    clearDrawings,
  } = useChartStore();

  const refreshInterval = useMemo(() => {
    if (timeframe.endsWith('m')) return 15_000;
    if (timeframe.endsWith('h')) return 45_000;
    return 120_000;
  }, [timeframe]);

  const { data: candles = [], isLoading, mutate, error } = useSWR(
    ['candles', symbol, timeframe],
    async ([, selectedSymbol, frame]) => loadCandles(selectedSymbol, frame),
    {
      refreshInterval,
      revalidateOnFocus: false,
    },
  );

  const handleRefresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  const chartReady = candles.length > 0 && !isLoading && !error;

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      <TopBar onSymbolSelect={setSymbol} onToggleTheme={toggleTheme} theme={theme} />
      <div className="grid flex-1 grid-cols-[300px_1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          <Watchlist activeSymbol={symbol} onSelect={setSymbol} />
          <IndicatorPanel candles={candles} />
        </div>
        <div className="flex flex-col gap-4">
          <ChartControls
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            chartType={chartType}
            onChartTypeChange={setChartType}
            onRefresh={handleRefresh}
          />
          <div className="relative flex h-[520px] rounded-2xl border border-slate-800/60 bg-slate-900/80 shadow-xl">
            <div className="absolute left-4 top-1/2 z-30 -translate-y-1/2">
              <DrawingToolbar activeTool={activeTool} onChange={setActiveTool} />
            </div>
            <div className="relative ml-20 flex-1 overflow-hidden rounded-2xl">
              {chartReady ? (
                <TradingChart
                  symbol={symbol}
                  candles={candles}
                  chartType={chartType}
                  drawings={drawings}
                  activeTool={activeTool}
                  theme={theme}
                  onAddDrawing={addDrawing}
                  onClearDrawings={clearDrawings}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  {error ? 'Failed to load market data' : 'Loading data...'}
                </div>
              )}
            </div>
          </div>
          <SymbolOverview symbol={symbol} candles={candles} />
        </div>
        <div className="flex flex-col gap-4">
          <OrderBook candles={candles} />
          <div className="flex-1 rounded-xl border border-slate-800/60 bg-slate-900/80 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Notes</h3>
            <textarea
              placeholder="Store your analysis notes here..."
              className="mt-3 h-full w-full resize-none rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
