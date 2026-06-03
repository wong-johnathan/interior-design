'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const CATEGORIES = ['Seating', 'Tables', 'Lighting', 'Decor', 'Storage'];

const ITEMS_BY_CATEGORY: Record<string, { icon: string; name: string; count: number }[]> = {
  Seating: [
    { icon: '🛋️', name: '3-Seater Sofa', count: 4 },
    { icon: '🛋️', name: 'Sectional Sofa', count: 2 },
    { icon: '🛋️', name: 'Loveseat', count: 3 },
    { icon: '🛋️', name: 'Chaise Lounge', count: 1 },
  ],
  Tables: [
    { icon: '🪑', name: 'Coffee Table', count: 5 },
    { icon: '🪑', name: 'Dining Table', count: 3 },
    { icon: '🪑', name: 'Side Table', count: 4 },
  ],
  Lighting: [
    { icon: '💡', name: 'Floor Lamp', count: 6 },
    { icon: '💡', name: 'Table Lamp', count: 4 },
    { icon: '💡', name: 'Pendant Light', count: 3 },
  ],
};

export function CatalogPanel() {
  const [activeCategory, setActiveCategory] = useState('Seating');
  const [search, setSearch] = useState('');

  const items = ITEMS_BY_CATEGORY[activeCategory] || [];

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>🛋️ Furniture Catalog</span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs bg-slate-700 border-slate-600 text-white placeholder-slate-500"
        />
      </div>

      {/* Category sidebar */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] px-2.5 py-1 rounded-full transition ${
              activeCategory === cat
                ? 'bg-teal-600/20 text-teal-300'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition group"
          >
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-xs text-slate-300">{item.name}</span>
            </div>
            <span className="text-[10px] text-slate-500">[{item.count}]</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-700 mt-2">
        Drag any item into the room to place it!
      </div>
    </div>
  );
}
