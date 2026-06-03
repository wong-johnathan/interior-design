'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export function BTOProjectForm() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label className="text-slate-300">Project Name</Label>
        <Input className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Verandah Kallang 2024" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-300">Slug</Label>
          <Input className="bg-slate-800 border-slate-700 text-white" placeholder="verandah-kallang-2024" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Launch Year</Label>
          <Input type="number" className="bg-slate-800 border-slate-700 text-white" placeholder="2024" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Location</Label>
        <Input className="bg-slate-800 border-slate-700 text-white" placeholder="Kallang" />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Description</Label>
        <textarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white placeholder-slate-500 h-20 resize-none" placeholder="Project description..." />
      </div>
      <Button className="bg-teal-600 hover:bg-teal-500">
        <Save className="w-4 h-4 mr-2" />
        Save BTO Project
      </Button>
    </div>
  );
}
