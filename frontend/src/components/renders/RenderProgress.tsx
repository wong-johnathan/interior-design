'use client';

import { Progress } from '@/components/ui/progress';

interface RenderProgressProps {
  current: number;
  total: number;
  roomLabel?: string;
}

export function RenderProgress({ current, total, roomLabel }: RenderProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {roomLabel ? `Rendering ${roomLabel}...` : 'Generating renders...'}
        </span>
        <span className="text-teal-300 font-medium">
          {current} of {total}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="text-[10px] text-slate-500 text-center">
        AI is creating your photorealistic render (~10s per room)
      </div>
    </div>
  );
}
