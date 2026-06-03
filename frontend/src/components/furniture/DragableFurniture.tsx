'use client';

export function DragableFurniture() {
  return (
    <div className="absolute cursor-grab active:cursor-grabbing">
      <div className="bg-teal-500/20 border border-teal-500/40 rounded p-2 text-xs text-teal-300">
        🛋️ Drag me
      </div>
    </div>
  );
}
