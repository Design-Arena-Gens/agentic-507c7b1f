'use client';

import { Fragment } from 'react';
import { DrawingTool } from '@/lib/types';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onChange: (tool: DrawingTool) => void;
}

const tools: { id: DrawingTool; label: string; badge: string }[] = [
  { id: 'none', label: 'Select', badge: 'SEL' },
  { id: 'trendline', label: 'Trendline', badge: 'TL' },
  { id: 'ray', label: 'Ray', badge: 'RAY' },
  { id: 'horizontal-line', label: 'Horizontal', badge: 'H' },
  { id: 'vertical-line', label: 'Vertical', badge: 'V' },
  { id: 'rectangle', label: 'Rectangle', badge: 'RECT' },
  { id: 'brush', label: 'Brush', badge: 'BR' },
];

export function DrawingToolbar({ activeTool, onChange }: DrawingToolbarProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700/40 bg-slate-900/80 p-2 shadow-lg backdrop-blur">
      {tools.map((tool) => (
        <Fragment key={tool.id}>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition ${
              activeTool === tool.id ? 'bg-accent text-slate-900 shadow-inner font-semibold' : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
            onClick={() => onChange(tool.id)}
          >
            <span aria-hidden className="text-xs font-semibold tracking-wide">
              {tool.badge}
            </span>
            <span className="sr-only">{tool.label}</span>
          </button>
        </Fragment>
      ))}
    </div>
  );
}
