'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export function FlatModelForm() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label className="text-slate-300">Model Name</Label>
        <Input className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 4-Room Model A" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-300">Flat Type</Label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option>3-room</option>
            <option>4-room</option>
            <option>5-room</option>
            <option>executive</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Total Area (sqm)</Label>
          <Input type="number" className="bg-slate-800 border-slate-700 text-white" placeholder="90" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Floor Plan Image</Label>
        <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center text-xs text-slate-500 cursor-pointer hover:border-slate-600">
          Click to upload floor plan image
        </div>
      </div>
      <Button className="bg-teal-600 hover:bg-teal-500">
        <Save className="w-4 h-4 mr-2" />
        Save Flat Model
      </Button>
    </div>
  );
}
