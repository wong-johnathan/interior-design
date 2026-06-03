'use client';

export function DragGhost() {
  return (
    <div className="opacity-40 pointer-events-none">
      <div className="bg-slate-500/30 border border-dashed border-slate-500 rounded p-2 text-xs text-slate-400">
        🛋️ Ghost
      </div>
    </div>
  );
}
