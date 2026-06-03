'use client';

import { Check } from 'lucide-react';

interface FurnitureItemListProps {
  items: string[];
  templateName: string;
}

export function FurnitureItemList({ items, templateName }: FurnitureItemListProps) {
  return (
    <div className="bg-slate-700/20 rounded-lg p-2.5">
      <div className="text-[10px] text-slate-400 mb-1.5">
        {templateName} includes:
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Check className="w-3 h-3 text-teal-400 shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
