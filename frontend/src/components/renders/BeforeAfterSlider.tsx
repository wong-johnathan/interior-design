'use client';

import { useState } from 'react';

interface BeforeAfterSliderProps {
  beforeUrl?: string;
  afterUrl?: string;
  roomLabel?: string;
}

export function BeforeAfterSlider({ beforeUrl, afterUrl, roomLabel }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-lg bg-slate-700/30 select-none" style={{ aspectRatio: '16/9' }}>
      {/* Placeholder before/after */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-slate-600/30 flex items-center justify-center text-xs text-slate-400">
          Before
        </div>
        <div className="flex-1 bg-slate-500/30 flex items-center justify-center text-xs text-slate-400">
          After
        </div>
      </div>
      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
        style={{ left: `${position}%` }}
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startPos = position;
          const onMove = (ev: MouseEvent) => {
            const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
            if (rect) {
              const pct = ((ev.clientX - rect.left) / rect.width) * 100;
              setPosition(Math.max(0, Math.min(100, pct)));
            }
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', () => window.removeEventListener('mousemove', onMove), { once: true });
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
          <span className="text-xs">↔</span>
        </div>
      </div>
    </div>
  );
}
