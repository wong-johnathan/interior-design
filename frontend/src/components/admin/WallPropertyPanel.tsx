'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WallPropertyPanel() {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wall Properties</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-400">Length (m)</Label>
          <Input className="h-7 text-xs bg-slate-800 border-slate-700 text-white" value="4.0" readOnly />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-400">Thickness (m)</Label>
          <Input className="h-7 text-xs bg-slate-800 border-slate-700 text-white" value="0.15" readOnly />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-slate-400">Wall Type</Label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white">
          <option>Internal</option>
          <option>External</option>
          <option>Party</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" className="accent-teal-500" />
        Load-bearing
      </label>
    </div>
  );
}
