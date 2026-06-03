'use client';

import { MousePointer2, Pencil, Trash2, Undo2, Redo2, Grid3X3, RotateCcw } from 'lucide-react';

interface FloorPlanToolbarProps {
  activeTool: 'select' | 'draw' | 'delete';
  onToolChange: (tool: 'select' | 'draw' | 'delete') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
  onReset: () => void;
}

export function FloorPlanToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  gridSnap,
  onToggleGridSnap,
  onReset,
}: FloorPlanToolbarProps) {
  const tools = [
    { id: 'select' as const, icon: MousePointer2, label: 'Select' },
    { id: 'draw' as const, icon: Pencil, label: 'Draw' },
    { id: 'delete' as const, icon: Trash2, label: 'Delete' },
  ];

  return (
    <div className="space-y-1">
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg transition ${
            activeTool === t.id
              ? 'bg-teal-600/20 text-teal-300 border border-teal-600/40'
              : 'text-slate-400 hover:bg-slate-700/50 border border-transparent'
          }`}
        >
          <t.icon className="w-3.5 h-3.5" />
          {t.label}
        </button>
      ))}
      <div className="border-t border-slate-700 my-2" />
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:bg-slate-700/50 rounded-lg disabled:opacity-30"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:bg-slate-700/50 rounded-lg disabled:opacity-30"
      >
        <Redo2 className="w-3.5 h-3.5" />
        Redo
      </button>
      <div className="border-t border-slate-700 my-2" />
      <button
        onClick={onToggleGridSnap}
        className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg ${
          gridSnap ? 'text-teal-300 bg-teal-600/10' : 'text-slate-400 hover:bg-slate-700/50'
        }`}
      >
        <Grid3X3 className="w-3.5 h-3.5" />
        Grid snap
      </button>
      <button
        onClick={onReset}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:bg-slate-700/50 rounded-lg"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </button>
    </div>
  );
}
