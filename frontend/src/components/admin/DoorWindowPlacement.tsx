'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DoorWindowPlacement() {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Openings</div>

      <div className="space-y-2">
        <Label className="text-[10px] text-slate-400">Doors</Label>
        <div className="bg-slate-700/30 rounded p-2 space-y-2">
          {['Main Door', 'Bedroom Door'].map((door) => (
            <div key={door} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">🚪 {door}</span>
              <span className="text-[10px] text-slate-500">0.9m</span>
            </div>
          ))}
          <button className="text-[10px] text-teal-400 hover:text-teal-300">+ Add Door</button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] text-slate-400">Windows</Label>
        <div className="bg-slate-700/30 rounded p-2 space-y-2">
          {['Living Window', 'Bedroom Window'].map((win) => (
            <div key={win} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">🪟 {win}</span>
              <span className="text-[10px] text-slate-500">1.2m</span>
            </div>
          ))}
          <button className="text-[10px] text-teal-400 hover:text-teal-300">+ Add Window</button>
        </div>
      </div>
    </div>
  );
}
