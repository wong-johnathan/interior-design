'use client';

export function WallAnnotationCanvas() {
  return (
    <div className="w-full aspect-[16/9] bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
      <div className="text-center text-slate-500">
        <div className="text-5xl mb-3">📐</div>
        <div className="text-sm font-medium">Wall Annotation Canvas</div>
        <div className="text-xs text-slate-600 mt-1">Draw walls on floor plan · Auto-detect rooms</div>
      </div>
    </div>
  );
}
