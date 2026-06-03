'use client';

interface RenderCardProps {
  roomLabel: string;
  roomType: string;
  style: string;
  isStale?: boolean;
}

export function RenderCard({ roomLabel, roomType, style, isStale }: RenderCardProps) {
  return (
    <div className="bg-slate-700/30 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 transition group">
      <div className="aspect-[4/3] flex items-center justify-center relative">
        <div className="text-center">
          <div className="text-3xl mb-1">🖼️</div>
          <div className="text-[10px] text-slate-400">{roomLabel}</div>
        </div>
        {isStale && (
          <div className="absolute top-2 right-2 bg-amber-500/80 text-[9px] text-white px-1.5 py-0.5 rounded">
            Stale
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="text-[10px] text-slate-400">{style}</div>
      </div>
    </div>
  );
}
