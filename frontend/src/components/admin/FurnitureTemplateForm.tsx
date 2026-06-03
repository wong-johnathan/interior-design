'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export function FurnitureTemplateForm() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label className="text-slate-300">Template Name</Label>
        <Input className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Japandi Living Room Set" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-300">Category</Label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option>Living</option>
            <option>Bedroom</option>
            <option>Dining</option>
            <option>Kitchen</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Style Tag</Label>
          <Input className="bg-slate-800 border-slate-700 text-white" placeholder="japandi (optional)" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Furniture Items (JSON)</Label>
        <textarea
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono h-32 resize-none"
          placeholder='[{"type": "sofa", "label": "Low Wooden Sofa", "position": [0, 0, 0]}]'
        />
      </div>
      <Button className="bg-teal-600 hover:bg-teal-500">
        <Save className="w-4 h-4 mr-2" />
        Save Template
      </Button>
    </div>
  );
}
