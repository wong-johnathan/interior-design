'use client';

interface FloorPlanHistoryProps {
  historyIndex: number;
  totalSteps: number;
  onUndo: () => void;
  onRedo: () => void;
}

export function FloorPlanHistory({ historyIndex, totalSteps, onUndo, onRedo }: FloorPlanHistoryProps) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-500">
      <button
        onClick={onUndo}
        disabled={historyIndex <= 0}
        className="disabled:opacity-30 hover:text-slate-300"
      >
        ↩ Undo
      </button>
      <span>
        {historyIndex + 1}/{totalSteps}
      </span>
      <button
        onClick={onRedo}
        disabled={historyIndex >= totalSteps - 1}
        className="disabled:opacity-30 hover:text-slate-300"
      >
        Redo ↪
      </button>
    </div>
  );
}
