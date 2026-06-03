'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FurnitureTemplateCard } from './FurnitureTemplateCard';
import { FurnitureItemList } from './FurnitureItemList';
import { Sparkles, ChevronDown, Search } from 'lucide-react';

const MOCK_TEMPLATES = [
  { id: 'jp-liv-1', name: 'Japandi Living Room Set', style: 'Japandi', roomType: 'living', thumbnail: null, items: ['Low wooden sofa', 'Oval coffee table', 'Tatami rug', 'Floor lamp', 'TV console'] },
  { id: 'sc-liv-1', name: 'Scandi Living Room Set', style: 'Scandinavian', roomType: 'living', thumbnail: null, items: ['3-seat sofa', 'Coffee table', 'Wool rug', 'Floor lamp', 'TV console', 'Plant'] },
  { id: 'in-liv-1', name: 'Industrial Living Set', style: 'Industrial', roomType: 'living', thumbnail: null, items: ['Leather sofa', 'Metal coffee table', 'Industrial lamp', 'Shelf unit'] },
];

export function FurnitureSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  const template = MOCK_TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Recommended Template
      </div>

      {MOCK_TEMPLATES.slice(0, 1).map((t) => (
        <FurnitureTemplateCard
          key={t.id}
          template={t}
          isSelected={selectedTemplate === t.id}
          onSelect={() => setSelectedTemplate(t.id)}
        />
      ))}

      {template && (
        <FurnitureItemList
          items={template.items}
          templateName={template.name}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-xs flex-1">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Apply & Continue
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-slate-600 text-slate-300"
          onClick={() => setShowCatalog(!showCatalog)}
        >
          Tweak Mode
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Alternative templates */}
      <div className="pt-3 border-t border-slate-700">
        <div className="text-xs text-slate-500 mb-2">Alternatives:</div>
        <div className="space-y-1">
          {MOCK_TEMPLATES.slice(1).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition ${
                selectedTemplate === t.id
                  ? 'bg-teal-600/10 text-teal-300'
                  : 'text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
