'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, X, Grid3X3, Sofa, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFurnitureStore, FURNITURE_TEMPLATES } from '@/stores/furnitureStore';
import type { FurnitureTemplate } from '@/stores/furnitureStore';

const CATEGORIES = ['All', 'Living Room', 'Bedroom', 'Kitchen', 'Bathroom'];
const STYLES = ['All', 'Japandi', 'Scandi', 'Industrial', 'Vintage', 'Modern'];

interface FurnitureCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FurnitureCatalog({ open, onOpenChange }: FurnitureCatalogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStyle, setActiveStyle] = useState('All');
  const [draggingItem, setDraggingItem] = useState<FurnitureTemplate | null>(null);

  const addItem = useFurnitureStore((s) => s.addItem);
  const isCatalogOpen = useFurnitureStore((s) => s.isCatalogOpen);

  const filteredItems = useMemo(() => {
    return FURNITURE_TEMPLATES.filter((item) => {
      const matchesSearch =
        !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory;
      const matchesStyle =
        activeStyle === 'All' || item.style === activeStyle;
      return matchesSearch && matchesCategory && matchesStyle;
    });
  }, [search, activeCategory, activeStyle]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: FurnitureTemplate) => {
      setDraggingItem(item);
      e.dataTransfer.setData('text/plain', JSON.stringify(item));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingItem(null);
  }, []);

  const handleAddToRoom = useCallback(
    (item: FurnitureTemplate) => {
      // Place at center-ish of viewport
      addItem(item, 0, 0);
    },
    [addItem]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet panel */}
      <div className="relative w-80 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full z-50 animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Sofa className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Furniture Catalog</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder="Search furniture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-800 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] px-2.5 py-1 rounded-full transition ${
                  activeCategory === cat
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Style filters */}
        <div className="px-4 pb-3 shrink-0">
          <div className="flex gap-1 flex-wrap">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setActiveStyle(style)}
                className={`text-[10px] px-2.5 py-1 rounded-full transition ${
                  activeStyle === style
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="px-4 pb-1 shrink-0">
          <p className="text-[10px] text-slate-500">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Package className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">No furniture found</p>
              <p className="text-[10px]">Try adjusting filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAddToRoom(item)}
                  className="group relative bg-slate-800 rounded-lg border border-slate-700 p-2.5 cursor-pointer hover:border-teal-600/50 transition-all hover:bg-slate-750 active:scale-[0.98]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl leading-none">{item.icon}</span>
                    <span className="text-[11px] text-slate-300 font-medium text-center leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {item.width}m × {item.depth}m × {item.height}m
                    </span>
                    <span className="text-[9px] text-slate-600">{item.style}</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-teal-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-teal-300 font-medium bg-slate-900/80 px-2 py-0.5 rounded">
                      Drag into room
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-700 shrink-0">
          <p className="text-[10px] text-slate-500 text-center">
            Drag items or click to place at center
          </p>
        </div>
      </div>
    </div>
  );
}
