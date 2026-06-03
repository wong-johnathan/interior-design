'use client';

import { Check } from 'lucide-react';

interface FurnitureTemplateCardProps {
  template: {
    id: string;
    name: string;
    style: string;
    roomType: string;
    thumbnail: string | null;
    items: string[];
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function FurnitureTemplateCard({ template, isSelected, onSelect }: FurnitureTemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-slate-700/30 rounded-lg overflow-hidden border transition ${
        isSelected ? 'border-teal-500 ring-1 ring-teal-500/30' : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Thumbnail area */}
      <div className="h-20 bg-slate-600/30 flex items-center justify-center">
        <div className="text-3xl">🛋️</div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="text-xs font-medium text-white">{template.name}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {template.style} · {template.items.length} items
        </div>
        {isSelected && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-teal-400">
            <Check className="w-3 h-3" />
            Selected
          </div>
        )}
      </div>
    </button>
  );
}
