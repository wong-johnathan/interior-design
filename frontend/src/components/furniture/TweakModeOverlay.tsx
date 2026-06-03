'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  Grid3X3,
  Sofa,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  Settings,
  Undo2,
  Redo2,
  X,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFurnitureStore } from '@/stores/furnitureStore';
import type { FurnitureItem } from '@/stores/furnitureStore';

interface TweakModeOverlayProps {
  enabled: boolean;
}

// Scale factor: 1 meter = N pixels on the overlay
const SCALE = 80;
const GRID_SIZE = 0.5; // meters

export function TweakModeOverlay({ enabled }: TweakModeOverlayProps) {
  const placedItems = useFurnitureStore((s) => s.placedItems);
  const selectedItemId = useFurnitureStore((s) => s.selectedItemId);
  const showGrid = useFurnitureStore((s) => s.showGrid);
  const selectItem = useFurnitureStore((s) => s.selectItem);
  const moveItem = useFurnitureStore((s) => s.moveItem);
  const rotateItem = useFurnitureStore((s) => s.rotateItem);
  const removeItem = useFurnitureStore((s) => s.removeItem);
  const duplicateItem = useFurnitureStore((s) => s.duplicateItem);
  const toggleGrid = useFurnitureStore((s) => s.toggleGrid);
  const setTweakMode = useFurnitureStore((s) => s.setTweakMode);
  const setCatalogOpen = useFurnitureStore((s) => s.setCatalogOpen);
  const undo = useFurnitureStore((s) => s.undo);
  const redo = useFurnitureStore((s) => s.redo);
  const resetAll = useFurnitureStore((s) => s.resetAll);
  const isCatalogOpen = useFurnitureStore((s) => s.isCatalogOpen);
  const pushHistory = useFurnitureStore((s) => s.pushHistory);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
  } | null>(null);
  const [dragging, setDragging] = useState<{
    itemId: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 800, height: 600 });

  // Update overlay size on resize
  useEffect(() => {
    const updateSize = () => {
      if (overlayRef.current) {
        setOverlaySize({
          width: overlayRef.current.clientWidth,
          height: overlayRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [enabled]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z = Undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z = Redo
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
      // G = Toggle grid
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleGrid();
      }
      // Delete/Backspace = Remove selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault();
        removeItem(selectedItemId);
        setContextMenu(null);
      }
      // Escape = Deselect
      if (e.key === 'Escape') {
        selectItem(null);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, selectedItemId, undo, redo, toggleGrid, removeItem, selectItem]);

  // Convert meters to pixels offset from center
  const toPixel = (val: number) => val * SCALE;
  const centerX = overlaySize.width / 2;
  const centerY = overlaySize.height / 2;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, item: FurnitureItem) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      selectItem(item.id);

      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      const offsetX = e.clientX - rect.left - (centerX + toPixel(item.x));
      const offsetY = e.clientY - rect.top - (centerY + toPixel(item.y));

      setDragging({
        itemId: item.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX,
        offsetY,
      });
    },
    [selectItem, centerX, centerY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;

      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX = e.clientX - rect.left - centerX - dragging.offsetX;
      const rawY = e.clientY - rect.top - centerY - dragging.offsetY;

      // Snap to grid
      const x = Math.round(rawX / SCALE / GRID_SIZE) * GRID_SIZE;
      const y = Math.round(rawY / SCALE / GRID_SIZE) * GRID_SIZE;

      moveItem(dragging.itemId, x, y);
    },
    [dragging, moveItem, centerX, centerY]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      pushHistory();
      setDragging(null);
    }
  }, [dragging, pushHistory]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: FurnitureItem) => {
      e.preventDefault();
      e.stopPropagation();
      selectItem(item.id);
      setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
    },
    [selectItem]
  );

  const handleCanvasClick = useCallback(() => {
    selectItem(null);
    setContextMenu(null);
  }, [selectItem]);

  // Context menu actions
  const handleRemove = useCallback(() => {
    if (contextMenu) {
      removeItem(contextMenu.itemId);
      setContextMenu(null);
    }
  }, [contextMenu, removeItem]);

  const handleRotate90 = useCallback(() => {
    if (contextMenu) {
      const item = placedItems.find((i) => i.id === contextMenu.itemId);
      if (item) {
        const newRotation = (item.rotation + 90) % 360;
        rotateItem(contextMenu.itemId, newRotation);
        pushHistory();
      }
      setContextMenu(null);
    }
  }, [contextMenu, placedItems, rotateItem, pushHistory]);

  const handleDuplicate = useCallback(() => {
    if (contextMenu) {
      duplicateItem(contextMenu.itemId);
      setContextMenu(null);
    }
  }, [contextMenu, duplicateItem]);

  const handleItemDoubleClick = useCallback(
    (item: FurnitureItem) => {
      // Properties placeholder
      selectItem(item.id);
    },
    [selectItem]
  );

  if (!enabled) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-30 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      style={{ cursor: dragging ? 'grabbing' : 'default' }}
    >
      {/* Grid overlay */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
          <defs>
            <pattern
              id="tweak-grid"
              width={SCALE * GRID_SIZE}
              height={SCALE * GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${SCALE * GRID_SIZE} 0 L 0 0 0 ${SCALE * GRID_SIZE}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tweak-grid)" />
        </svg>
      )}

      {/* Furniture items as rectangles */}
      {placedItems.map((item) => {
        const px = centerX + toPixel(item.x);
        const py = centerY + toPixel(item.y);
        const w = toPixel(item.width);
        const d = toPixel(item.depth);
        const isSelected = selectedItemId === item.id;
        const rad = (item.rotation * Math.PI) / 180;

        // Rotation handle offset
        const handleOffset = 20;

        return (
          <div
            key={item.id}
            className={`absolute flex items-center justify-center transition-shadow ${
              isSelected ? 'z-20' : 'z-10'
            }`}
            style={{
              left: px - w / 2,
              top: py - d / 2,
              width: w,
              height: d,
              transform: `rotate(${item.rotation}deg)`,
              transformOrigin: 'center center',
            }}
            onMouseDown={(e) => handleMouseDown(e, item)}
            onContextMenu={(e) => handleContextMenu(e, item)}
            onDoubleClick={() => handleItemDoubleClick(item)}
          >
            {/* Background rectangle */}
            <div
              className={`absolute inset-0 rounded-md border-2 transition-colors ${
                isSelected
                  ? 'border-teal-400 bg-teal-500/20 shadow-lg shadow-teal-500/30'
                  : 'border-slate-500/50 bg-slate-700/60 hover:border-slate-400/70'
              }`}
            >
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg leading-none">{item.icon}</span>
              </div>

              {/* Label */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[9px] text-slate-400 bg-slate-800/80 px-1 rounded">
                  {item.name}
                </span>
              </div>
            </div>

            {/* Selection handles */}
            {isSelected && (
              <>
                {/* Corner handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-slate-900 z-30" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-slate-900 z-30" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-slate-900 z-30" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-slate-900 z-30" />

                {/* Rotation indicator */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="w-0.5 h-4 bg-teal-400/50 mx-auto" />
                  <div className="w-2 h-2 bg-teal-400 rounded-full mx-auto" />
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Top bar: Undo/Redo */}
      <div className="absolute top-3 left-3 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); undo(); }}
          className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); redo(); }}
          className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating action bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-800/90 hover:bg-slate-700 text-xs flex items-center gap-1 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setCatalogOpen(!isCatalogOpen);
          }}
        >
          <Sofa className="w-3.5 h-3.5" />
          Catalog
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={`text-xs flex items-center gap-1 backdrop-blur-sm ${
            showGrid
              ? 'bg-teal-600/80 hover:bg-teal-600 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleGrid();
          }}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          Grid
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="bg-red-700/80 hover:bg-red-700 text-xs flex items-center gap-1 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            resetAll();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-800/90 hover:bg-slate-700 text-xs flex items-center gap-1 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setTweakMode(false);
          }}
        >
          <X className="w-3.5 h-3.5" />
          Exit
        </Button>
      </div>

      {/* Right panel: Placed items list */}
      <div className="absolute top-3 right-3 w-48 max-h-[50vh] bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 overflow-y-auto">
        <div className="px-3 py-2 border-b border-slate-700 sticky top-0 bg-slate-800/95">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Placed Items ({placedItems.length})
          </h3>
        </div>
        {placedItems.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[10px] text-slate-500">No items placed yet</p>
            <p className="text-[9px] text-slate-600 mt-1">
              Open Catalog to add furniture
            </p>
          </div>
        ) : (
          placedItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-600/20 text-teal-300'
                    : 'hover:bg-slate-700/50 text-slate-300'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  selectItem(item.id);
                }}
              >
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] truncate">{item.name}</p>
                  <p className="text-[8px] text-slate-500">
                    ({item.x.toFixed(1)}, {item.y.toFixed(1)}) · {item.rotation}°
                  </p>
                </div>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-teal-400' : 'bg-slate-600'
                  }`}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleRemove}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700 text-left"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
            <button
              onClick={handleRotate90}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 text-left"
            >
              <RotateCw className="w-3 h-3" />
              Rotate 90°
            </button>
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 text-left"
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </button>
            <div className="border-t border-slate-700 my-1" />
            <button
              onClick={() => {
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 text-left"
            >
              <Settings className="w-3 h-3" />
              Properties
            </button>
          </div>
        </>
      )}
    </div>
  );
}
