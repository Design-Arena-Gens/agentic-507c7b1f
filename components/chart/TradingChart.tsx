'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  BarData,
  CandlestickData,
  IChartApi,
  IPriceScaleApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import { ChartType, CandleData, Drawing, DrawingPoint, DrawingTool } from '@/lib/types';

interface TradingChartProps {
  symbol: string;
  candles: CandleData[];
  chartType: ChartType;
  drawings: Drawing[];
  activeTool: DrawingTool;
  theme: 'dark' | 'light';
  onAddDrawing: (tool: Exclude<DrawingTool, 'none'>, points: DrawingPoint[]) => void;
  onClearDrawings: () => void;
}

type PriceSeries =
  | ISeriesApi<'Candlestick'>
  | ISeriesApi<'Bar'>
  | ISeriesApi<'Area'>
  | ISeriesApi<'Line'>;

type DraftDrawing = {
  tool: DrawingTool;
  points: DrawingPoint[];
};

const DARK_LAYOUT = {
  background: { color: '#0f172a' },
  textColor: '#e2e8f0',
  grid: {
    vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
    horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
  },
};

const LIGHT_LAYOUT = {
  background: { color: '#f8fafc' },
  textColor: '#0f172a',
  grid: {
    vertLines: { color: 'rgba(148, 163, 184, 0.25)' },
    horzLines: { color: 'rgba(148, 163, 184, 0.25)' },
  },
};

function toTimestamp(value: number | UTCTimestamp | { year: number; month: number; day: number } | string) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Math.floor(new Date(value).getTime() / 1000);
  }

  if ('year' in value) {
    const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
    return Math.floor(date.getTime() / 1000);
  }

  return value as number;
}

export function TradingChart({
  symbol,
  candles,
  chartType,
  drawings,
  activeTool,
  theme,
  onAddDrawing,
  onClearDrawings,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<PriceSeries | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceScaleRef = useRef<IPriceScaleApi | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const drawingStateRef = useRef<DraftDrawing | null>(null);
  const [draft, setDraft] = useState<DraftDrawing | null>(null);

  const ensureCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const chart = chartRef.current;
    if (!container || !canvas || !chart) return;

    const { width, height } = container.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio ?? 1;

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(pixelRatio, pixelRatio);
    }

    chart.applyOptions({ width, height });
  }, []);

  const renderDrawings = useCallback(
    (draftDrawing?: DraftDrawing | null) => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const canvas = canvasRef.current;
      if (!chart || !series || !canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const { width, height } = canvas.getBoundingClientRect();
      context.clearRect(0, 0, width, height);

      const items: (Drawing & { color: string })[] = drawings.map((drawing) => ({
        ...drawing,
        color: drawing.color,
      }));

      if (draftDrawing && draftDrawing.tool !== 'none' && draftDrawing.points.length > 0) {
        items.push({
          id: 'draft',
          tool: draftDrawing.tool as Exclude<DrawingTool, 'none'>,
          points: draftDrawing.points,
          color: 'rgba(148, 163, 184, 0.8)',
          createdAt: Date.now(),
        });
      }

      const timeScale = chart.timeScale();

      items.forEach((drawing) => {
        const points = drawing.points
          .map((point) => {
            const x = timeScale.timeToCoordinate(point.time as UTCTimestamp);
            const y = series.priceToCoordinate(point.price);
            if (x === null || y === null) return null;
            return { x: Number(x), y: Number(y) };
          })
          .filter((value): value is { x: number; y: number } => value !== null);

        if (points.length === 0) return;

        context.strokeStyle = drawing.color;
        context.fillStyle = drawing.color;
        context.lineWidth = drawing.tool === 'brush' ? 2 : 1.75;

        switch (drawing.tool) {
          case 'trendline': {
            if (points.length < 2) return;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            context.lineTo(points[1].x, points[1].y);
            context.stroke();
            break;
          }
          case 'ray': {
            if (points.length < 2) return;
            const [start, end] = points;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const rayLength = width * 1.5;
            const rayEndX = start.x + Math.cos(angle) * rayLength;
            const rayEndY = start.y + Math.sin(angle) * rayLength;
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(rayEndX, rayEndY);
            context.stroke();
            break;
          }
          case 'horizontal-line': {
            const y = points[0].y;
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.setLineDash([6, 4]);
            context.stroke();
            context.setLineDash([]);
            break;
          }
          case 'vertical-line': {
            const x = points[0].x;
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.setLineDash([6, 4]);
            context.stroke();
            context.setLineDash([]);
            break;
          }
          case 'rectangle': {
            if (points.length < 2) return;
            const left = Math.min(points[0].x, points[1].x);
            const right = Math.max(points[0].x, points[1].x);
            const top = Math.min(points[0].y, points[1].y);
            const bottom = Math.max(points[0].y, points[1].y);
            context.globalAlpha = 0.08;
            context.fillRect(left, top, right - left, bottom - top);
            context.globalAlpha = 1;
            context.strokeRect(left, top, right - left, bottom - top);
            break;
          }
          case 'brush': {
            if (points.length < 2) return;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            for (let index = 1; index < points.length; index += 1) {
              const point = points[index];
              context.lineTo(point.x, point.y);
            }
            context.stroke();
            break;
          }
          default:
            break;
        }
      });
    },
    [drawings],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || chartRef.current) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: theme === 'dark' ? DARK_LAYOUT : LIGHT_LAYOUT,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 10,
        barSpacing: 12,
      },
      crosshair: {
        mode: 1,
      },
      grid: theme === 'dark' ? DARK_LAYOUT.grid : LIGHT_LAYOUT.grid,
    });

    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      ensureCanvasSize();
      renderDrawings(draft);
    });

    observer.observe(container);
    resizeObserverRef.current = observer;

    ensureCanvasSize();

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.applyOptions({
      layout: theme === 'dark' ? DARK_LAYOUT : LIGHT_LAYOUT,
      grid: theme === 'dark' ? DARK_LAYOUT.grid : LIGHT_LAYOUT.grid,
    });

    renderDrawings(draft);
  }, [theme, renderDrawings, draft]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
    }

    if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    let series: PriceSeries;

    switch (chartType) {
      case 'area':
        series = chart.addAreaSeries({
          lineColor: theme === 'dark' ? '#38bdf8' : '#0ea5e9',
          topColor: 'rgba(56, 189, 248, 0.35)',
          bottomColor: 'rgba(15, 23, 42, 0.1)',
        });
        series.setData(
          candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.close,
          })) as LineData[],
        );
        break;
      case 'line':
        series = chart.addLineSeries({
          color: theme === 'dark' ? '#38bdf8' : '#0ea5e9',
          lineWidth: 2,
        });
        series.setData(
          candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.close,
          })) as LineData[],
        );
        break;
      case 'bar':
        series = chart.addBarSeries({
          upColor: '#22d3ee',
          downColor: '#f87171',
          thinBars: false,
        });
        series.setData(
          candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          })) as BarData[],
        );
        break;
      case 'candlestick':
      default:
        series = chart.addCandlestickSeries({
          upColor: '#22d3ee',
          downColor: '#f87171',
          borderVisible: false,
          wickUpColor: '#22d3ee',
          wickDownColor: '#f87171',
        });
        series.setData(
          candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          })) as CandlestickData[],
        );

        volumeSeriesRef.current = chart.addHistogramSeries({
          priceScaleId: '',
          color: 'rgba(148, 163, 184, 0.5)',
          priceFormat: { type: 'volume' },
        });

        volumeSeriesRef.current.setData(
          candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.volume,
            color: candle.close >= candle.open ? 'rgba(56, 189, 248, 0.6)' : 'rgba(248, 113, 113, 0.6)',
          })),
        );

        const volumePriceScale = volumeSeriesRef.current.priceScale();
        volumePriceScale?.applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        break;
    }

    seriesRef.current = series;
    priceScaleRef.current = series.priceScale();
    chart.timeScale().fitContent();
    renderDrawings(draft);
  }, [candles, chartType, theme, renderDrawings, draft]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const timeScale = chart.timeScale();

    const handleChange = () => {
      renderDrawings(draft);
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleChange);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleChange);
    };
  }, [renderDrawings, draft]);

  useEffect(() => {
    renderDrawings(draft);
  }, [drawings, draft, renderDrawings]);

  const pointerToPoint = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): DrawingPoint | null => {
      const canvas = canvasRef.current;
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!canvas || !chart || !series) return null;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const timeScale = chart.timeScale();
      const logicalTime = timeScale.coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (price === null || logicalTime === null) return null;

      const time = typeof logicalTime === 'number' ? logicalTime : toTimestamp(logicalTime);

      return { time, price };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (activeTool === 'none') return;

      const point = pointerToPoint(event);
      if (!point) return;

      if (activeTool === 'horizontal-line') {
        onAddDrawing('horizontal-line', [point]);
        return;
      }

      if (activeTool === 'vertical-line') {
        onAddDrawing('vertical-line', [point]);
        return;
      }

      const draftDrawing: DraftDrawing = { tool: activeTool, points: [point] };
      drawingStateRef.current = draftDrawing;
      setDraft(draftDrawing);
    },
    [activeTool, onAddDrawing, pointerToPoint],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const state = drawingStateRef.current;
      if (!state) return;

      const point = pointerToPoint(event);
      if (!point) return;

      if (state.tool === 'brush') {
        const updated = { ...state, points: [...state.points, point] };
        drawingStateRef.current = updated;
        setDraft(updated);
        renderDrawings(updated);
        return;
      }

      const updated = { ...state, points: [state.points[0], point] };
      drawingStateRef.current = updated;
      setDraft(updated);
      renderDrawings(updated);
    },
    [pointerToPoint, renderDrawings],
  );

  const finalizeDrawing = useCallback(
    (additionalPoint?: DrawingPoint | null) => {
      const state = drawingStateRef.current;
      if (!state) return;

      let points = state.points;

      if (additionalPoint) {
        if (state.tool === 'brush') {
          points = [...state.points, additionalPoint];
        } else {
          points = [state.points[0], additionalPoint];
        }
      }

      const normalized = points.filter(Boolean) as DrawingPoint[];
      if (normalized.length >= 2 || (state.tool === 'brush' && normalized.length >= 2)) {
        onAddDrawing(state.tool as Exclude<DrawingTool, 'none'>, normalized);
      }

      drawingStateRef.current = null;
      setDraft(null);
      renderDrawings();
    },
    [onAddDrawing, renderDrawings],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const state = drawingStateRef.current;
      if (!state) return;
      const point = pointerToPoint(event);
      finalizeDrawing(point);
    },
    [finalizeDrawing, pointerToPoint],
  );

  const handlePointerLeave = useCallback(() => {
    const state = drawingStateRef.current;
    if (!state) return;

    drawingStateRef.current = null;
    setDraft(null);
    renderDrawings();
  }, [renderDrawings]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700/40 px-3 py-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{symbol}</h2>
          <p className="text-xs text-slate-400">Advanced charting environment</p>
        </div>
        <button
          type="button"
          onClick={onClearDrawings}
          className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-400 hover:text-white"
        >
          Clear Drawings
        </button>
      </div>
      <div className="relative flex-1">
        <div ref={containerRef} className="h-full w-full" />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full ${activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
      </div>
    </div>
  );
}
