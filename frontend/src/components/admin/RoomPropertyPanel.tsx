'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RoomPropertyPanel() {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Properties</div>
      <div className="space-y-1">
        <Label className="text-[10px] text-slate-400">Room Label</Label>
        <Input className="h-7 text-xs bg-slate-800 border-slate-700 text-white" value="Living Room" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-slate-400">Room Type</Label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white">
          <option>Living</option>
          <option>Master Bedroom</option>
          <option>Bedroom</option>
          <option>Kitchen</option>
          <option>Toilet</option>
          <option>Bomb Shelter</option>
          <option>Service Yard</option>
          <option>Balcony</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-400">Default Wall Color</Label>
          <Input className="h-7 text-xs bg-slate-800 border-slate-700 text-white" value="#F5F5F0" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-400">Default Floor</Label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white">
            <option>Parquet</option>
            <option>Tiles</option>
            <option>Laminate</option>
            <option>Vinyl</option>
          </select>
        </div>
      </div>
    </div>
  );
}
