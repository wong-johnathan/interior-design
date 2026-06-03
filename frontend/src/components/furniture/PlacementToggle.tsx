'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PlacementToggleProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

export function PlacementToggle({ label, enabled, onToggle }: PlacementToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs text-slate-300">{label}</Label>
      <Switch checked={enabled} onCheckedChange={onToggle} className="data-[state=checked]:bg-teal-600" />
    </div>
  );
}
