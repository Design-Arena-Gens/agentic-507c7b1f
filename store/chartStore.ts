'use client';

import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { ChartType, Drawing, DrawingPoint, DrawingTool, Timeframe } from '@/lib/types';
import { DRAWING_PALETTE } from '@/lib/symbols';

interface ChartState {
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  drawings: Drawing[];
  activeTool: DrawingTool;
  theme: 'dark' | 'light';
  priceAlerts: { id: string; price: number; direction: 'above' | 'below'; createdAt: number }[];
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (chartType: ChartType) => void;
  setActiveTool: (tool: DrawingTool) => void;
  toggleTheme: () => void;
  addDrawing: (tool: Exclude<DrawingTool, 'none'>, points: DrawingPoint[]) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  addPriceAlert: (price: number, direction: 'above' | 'below') => void;
  removePriceAlert: (id: string) => void;
}

const colors = DRAWING_PALETTE;
let colorIndex = 0;

const getNextColor = () => {
  const color = colors[colorIndex % colors.length];
  colorIndex += 1;
  return color;
};

export const useChartStore = create<ChartState>((set) => ({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  chartType: 'candlestick',
  drawings: [],
  activeTool: 'none',
  theme: 'dark',
  priceAlerts: [],
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setChartType: (chartType) => set({ chartType }),
  setActiveTool: (activeTool) => set({ activeTool }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  addDrawing: (tool, points) =>
    set((state) => ({
      drawings: [
        ...state.drawings,
        {
          id: nanoid(10),
          tool,
          points,
          color: getNextColor(),
          createdAt: Date.now(),
        },
      ],
    })),
  removeDrawing: (id) => set((state) => ({ drawings: state.drawings.filter((drawing) => drawing.id !== id) })),
  clearDrawings: () => set({ drawings: [] }),
  addPriceAlert: (price, direction) =>
    set((state) => ({
      priceAlerts: [
        ...state.priceAlerts,
        { id: nanoid(8), price, direction, createdAt: Date.now() },
      ],
    })),
  removePriceAlert: (id) =>
    set((state) => ({ priceAlerts: state.priceAlerts.filter((alert) => alert.id !== id) })),
}));
