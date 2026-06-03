'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Save,
  Upload,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RotateCw,
  Copy,
  GripVertical,
  LayoutDashboard,
  Sofa,
  Users,
  Settings,
  ArrowLeft,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// --- Types ---
interface TemplateFurnitureItem {
  id: string;
  templateId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  wallAnchor: 'none' | 'left' | 'right' | 'top' | 'bottom';
}

interface FurnitureTemplate {
  id: string;
  name: string;
  category: string;
  style: string;
  published: boolean;
  items: TemplateFurnitureItem[];
}

// --- Catalog items available for admin drag-drop ---
const ADMIN_CATALOG = [
  { id: 'adm_sofa', name: '3-Seater Sofa', icon: '🛋️', width: 2.0, depth: 0.9 },
  { id: 'adm_bed', name: 'Queen Bed', icon: '🛏️', width: 1.6, depth: 2.0 },
  { id: 'adm_table', name: 'Coffee Table', icon: '🪑', width: 1.2, depth: 0.7 },
  { id: 'adm_chair', name: 'Dining Chair', icon: '🪑', width: 0.45, depth: 0.5 },
  { id: 'adm_lamp', name: 'Floor Lamp', icon: '💡', width: 0.3, depth: 0.3 },
  { id: 'adm_wardrobe', name: 'Wardrobe', icon: '🚪', width: 1.5, depth: 0.6 },
  { id: 'adm_dresser', name: 'Dresser', icon: '🗄️', width: 1.2, depth: 0.5 },
  { id: 'adm_bookcase', name: 'Bookcase', icon: '📚', width: 0.8, depth: 0.3 },
  { id: 'adm_tv', name: 'TV Console', icon: '📺', width: 1.8, depth: 0.4 },
  { id: 'adm_nightstand', name: 'Nightstand', icon: '🪑', width: 0.5, depth: 0.4 },
];

const WALL_ANCHORS = [
  { value: 'none', label: 'Free' },
  { value: 'left', label: 'Left Wall' },
  { value: 'right', label: 'Right Wall' },
  { value: 'top', label: 'Top Wall' },
  { value: 'bottom', label: 'Bottom Wall' },
] as const;

const ROOM_CATEGORIES = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining'];
const STYLE_TAGS = ['Japandi', 'Scandi', 'Industrial', 'Vintage', 'Modern'];

// --- Viewport constants ---
const VIEWPORT_WIDTH = 500;
const VIEWPORT_HEIGHT = 360;
const SCALE = 100; // pixels per meter
const ROOM_W = 4.5; // meters
const ROOM_D = 3.5; // meters
const WALL_THICKNESS = 3;

// --- Collision detection ---
function rectsOverlap(
  x1: number, y1: number, w1: number, d1: number,
  x2: number, y2: number, w2: number, d2: number
): boolean {
  const pad = 0.05; // 5cm tolerance
  return (
    x1 - w1 / 2 - pad < x2 + w2 / 2 + pad &&
    x1 + w1 / 2 + pad > x2 - w2 / 2 - pad &&
    y1 - d1 / 2 - pad < y2 + d2 / 2 + pad &&
    y1 + d1 / 2 + pad > y2 - d2 / 2 - pad
  );
}

// --- Generate unique IDs ---
let admItemCounter = 100;
function nextAdmItemId(): string {
  return `adm_item_${++admItemCounter}`;
}

// --- Sidebar navigation items ---
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'furniture', label: 'Furniture Templates', icon: Sofa, href: '/admin/furniture', active: true },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
];

// --- Mock saved templates ---
const MOCK_SAVED_TEMPLATES: FurnitureTemplate[] = [
  {
    id: 't1',
    name: 'Japandi Living Room Set',
    category: 'Living Room',
    style: 'Japandi',
    published: true,
    items: [
      { id: 'i1', templateId: 'adm_sofa', name: '3-Seater Sofa', icon: '🛋️', x: 0, y: -1.0, width: 2.0, depth: 0.9, rotation: 0, wallAnchor: 'bottom' },
      { id: 'i2', templateId: 'adm_table', name: 'Coffee Table', icon: '🪑', x: 0, y: 0.3, width: 1.2, depth: 0.7, rotation: 0, wallAnchor: 'none' },
    ],
  },
  {
    id: 't2',
    name: 'Scandi Bedroom',
    category: 'Bedroom',
    style: 'Scandi',
    published: false,
    items: [
      { id: 'i3', templateId: 'adm_bed', name: 'Queen Bed', icon: '🛏️', x: 0, y: 0, width: 1.6, depth: 2.0, rotation: 0, wallAnchor: 'top' },
    ],
  },
];

export default function AdminFurniturePage() {
  // Template form state
  const [templateName, setTemplateName] = useState('New Template');
  const [category, setCategory] = useState('Living Room');
  const [style, setStyle] = useState('Japandi');
  const [published, setPublished] = useState(false);
  const [items, setItems] = useState<TemplateFurnitureItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startItemX: number;
    startItemY: number;
  } | null>(null);
  const [dragFromCatalog, setDragFromCatalog] = useState<boolean>(false);
  const [showSavedTemplates, setShowSavedTemplates] = useState(true);
  const [savedTemplates, setSavedTemplates] = useState<FurnitureTemplate[]>(MOCK_SAVED_TEMPLATES);
  const [toast, setToast] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  // Convert room coords to pixel coords
  const roomCenterX = VIEWPORT_WIDTH / 2;
  const roomCenterY = VIEWPORT_HEIGHT / 2;
  const roomPixelW = ROOM_W * SCALE;
  const roomPixelD = ROOM_D * SCALE;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // Collision detection for all items
  const collisionMap = useMemo(() => {
    const map = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (
          rectsOverlap(
            a.x, a.y, a.width, a.depth,
            b.x, b.y, b.width, b.depth
          )
        ) {
          map.add(a.id);
          map.add(b.id);
        }
      }
    }
    return map;
  }, [items]);

  // Add item from catalog
  const addItemFromCatalog = useCallback(
    (catItem: (typeof ADMIN_CATALOG)[0], x: number, y: number) => {
      const newItem: TemplateFurnitureItem = {
        id: nextAdmItemId(),
        templateId: catItem.id,
        name: catItem.name,
        icon: catItem.icon,
        x,
        y,
        width: catItem.width,
        depth: catItem.depth,
        rotation: 0,
        wallAnchor: 'none',
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
    },
    []
  );

  // Remove item
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItemId((prev) => (prev === id ? null : prev));
  }, []);

  // Duplicate item
  const duplicateItem = useCallback((id: string) => {
    setItems((prev) => {
      const source = prev.find((i) => i.id === id);
      if (!source) return prev;
      const dup: TemplateFurnitureItem = {
        ...source,
        id: nextAdmItemId(),
        x: source.x + 0.4,
        y: source.y + 0.4,
      };
      return [...prev, dup];
    });
  }, []);

  // Rotate item 45° snap
  const rotateItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, rotation: (Math.floor(i.rotation / 45) * 45 + 45) % 360 } : i
      )
    );
  }, []);

  // Update wall anchor
  const updateWallAnchor = useCallback((id: string, anchor: TemplateFurnitureItem['wallAnchor']) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, wallAnchor: anchor } : i))
    );
  }, []);

  // Mouse handlers for dragging items in viewport
  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      setSelectedItemId(itemId);
      setDraggingItem({
        id: itemId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startItemX: item.x,
        startItemY: item.y,
      });
    },
    [items]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingItem || !viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      const dx = (e.clientX - draggingItem.startMouseX) / SCALE;
      const dy = (e.clientY - draggingItem.startMouseY) / SCALE;

      // Snap to 45-degree grid (0.1m snap)
      const snap = 0.1;
      let newX = Math.round((draggingItem.startItemX + dx) / snap) * snap;
      let newY = Math.round((draggingItem.startItemY + dy) / snap) * snap;

      // Clamp to room bounds
      const halfW = (items.find((i) => i.id === draggingItem.id)?.width ?? 0.5) / 2;
      const halfD = (items.find((i) => i.id === draggingItem.id)?.depth ?? 0.5) / 2;
      newX = Math.max(-ROOM_W / 2 + halfW, Math.min(ROOM_W / 2 - halfW, newX));
      newY = Math.max(-ROOM_D / 2 + halfD, Math.min(ROOM_D / 2 - halfD, newY));

      setItems((prev) =>
        prev.map((i) => (i.id === draggingItem.id ? { ...i, x: newX, y: newY } : i))
      );
    },
    [draggingItem, items]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingItem(null);
    setDragFromCatalog(false);
  }, []);

  // Handle catalog drag start
  const handleCatalogDragStart = useCallback(
    (e: React.DragEvent, catItem: (typeof ADMIN_CATALOG)[0]) => {
      e.dataTransfer.setData('text/plain', JSON.stringify(catItem));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  const handleCatalogDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCatalogDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / SCALE) - ROOM_W / 2;
      const rawY = ((e.clientY - rect.top) / SCALE) - ROOM_D / 2;
      const snap = 0.1;
      const x = Math.round(rawX / snap) * snap;
      const y = Math.round(rawY / snap) * snap;

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const catItem = ADMIN_CATALOG.find((c) => c.id === data.id);
        if (catItem) {
          addItemFromCatalog(catItem, x, y);
        }
      } catch {
        // Ignore invalid drops
      }
    },
    [addItemFromCatalog]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === viewportRef.current || (e.target as HTMLElement).classList.contains('room-viewport')) {
        setSelectedItemId(null);
      }
    },
    []
  );

  // Save template
  const handleSave = useCallback(() => {
    const template: FurnitureTemplate = {
      id: `template_${Date.now()}`,
      name: templateName || 'Untitled Template',
      category,
      style,
      published,
      items: [...items],
    };
    setSavedTemplates((prev) => [...prev, template]);
    showToast('Template saved!');
  }, [templateName, category, style, published, items]);

  // Publish toggle
  const handlePublish = useCallback(() => {
    setPublished((p) => !p);
    showToast(published ? 'Unpublished' : 'Published');
  }, [published]);

  // Load template
  const loadTemplate = useCallback((template: FurnitureTemplate) => {
    setTemplateName(template.name);
    setCategory(template.category);
    setStyle(template.style);
    setPublished(template.published);
    setItems(template.items.map((i) => ({ ...i })));
    setSelectedItemId(null);
  }, []);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-800">
          <h1 className="text-sm font-bold text-teal-400 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 py-2">
          {sidebarItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${
                item.active
                  ? 'bg-teal-600/10 text-teal-300 border-r-2 border-teal-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-800 shrink-0">
          <a href="/admin" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <h2 className="text-base font-semibold">Furniture Template Manager</h2>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left side: Form + Viewport */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
            {/* Template Header */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-slate-400 mb-1.5 block">Template Name</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                    placeholder="e.g. Japandi Living Room Set"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1.5 block">Room Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {ROOM_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1.5 block">Style Tag</Label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {STYLE_TAGS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publish toggle + Save */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-slate-400">Publish</Label>
                  <Switch
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <span className={`text-[10px] ${published ? 'text-green-400' : 'text-slate-500'}`}>
                    {published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePublish}
                    className="text-xs border-slate-600 text-slate-300"
                  >
                    {published ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-teal-600 hover:bg-teal-500 text-xs"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save Template
                  </Button>
                </div>
              </div>
            </div>

            {/* 2D Room Viewport */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                2D Overhead Room View
                <span className="text-[10px] text-slate-500 font-normal ml-2 normal-case">
                  — Drag items from catalog or within room
                </span>
              </h3>
              <div
                ref={viewportRef}
                className="room-viewport relative mx-auto bg-slate-950 rounded-lg border border-slate-600 overflow-hidden cursor-default select-none"
                style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
                onDragOver={handleCatalogDragOver}
                onDrop={handleCatalogDrop}
              >
                {/* Room walls */}
                <svg className="absolute inset-0 pointer-events-none" width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT}>
                  {/* Floor */}
                  <rect
                    x={roomCenterX - roomPixelW / 2}
                    y={roomCenterY - roomPixelD / 2}
                    width={roomPixelW}
                    height={roomPixelD}
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth={WALL_THICKNESS}
                    rx={2}
                  />
                  {/* Wall labels */}
                  <text x={roomCenterX} y={12} textAnchor="middle" fill="#64748b" fontSize={9}>Top Wall</text>
                  <text x={roomCenterX} y={VIEWPORT_HEIGHT - 4} textAnchor="middle" fill="#64748b" fontSize={9}>Bottom Wall</text>
                  <text x={8} y={roomCenterY} textAnchor="middle" fill="#64748b" fontSize={9} transform={`rotate(-90, 8, ${roomCenterY})`}>Left Wall</text>
                  <text x={VIEWPORT_WIDTH - 8} y={roomCenterY} textAnchor="middle" fill="#64748b" fontSize={9} transform={`rotate(90, ${VIEWPORT_WIDTH - 8}, ${roomCenterY})`}>Right Wall</text>
                </svg>

                {/* Dimension guides */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 pointer-events-none">
                  {ROOM_W}m
                </div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-600 pointer-events-none">
                  {ROOM_D}m
                </div>

                {/* Furniture items */}
                {items.map((item) => {
                  const px = roomCenterX + item.x * SCALE;
                  const py = roomCenterY + item.y * SCALE;
                  const w = item.width * SCALE;
                  const d = item.depth * SCALE;
                  const isSelected = selectedItemId === item.id;
                  const hasCollision = collisionMap.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`absolute flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
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
                      onMouseDown={(e) => handleItemMouseDown(e, item.id)}
                    >
                      <div
                        className={`absolute inset-0 rounded border-2 flex items-center justify-center transition-colors ${
                          hasCollision
                            ? 'border-red-500 bg-red-500/20'
                            : isSelected
                            ? 'border-teal-400 bg-teal-500/20'
                            : 'border-slate-500/60 bg-slate-700/50 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-slate-500 whitespace-nowrap">
                          {item.name}
                        </span>
                      </div>
                      {isSelected && (
                        <>
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-teal-400 rounded-full border border-slate-900" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full border border-slate-900" />
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-400 rounded-full border border-slate-900" />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-teal-400 rounded-full border border-slate-900" />
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Empty state */}
                {items.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Sofa className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-[11px] text-slate-600">Drag furniture from the catalog</p>
                    <p className="text-[9px] text-slate-700">or click items below to add</p>
                  </div>
                )}
              </div>
            </div>

            {/* Per-item settings */}
            {selectedItem && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{selectedItem.icon}</span>
                  Item Settings: {selectedItem.name}
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-[10px] text-slate-400 mb-1 block">Position X</Label>
                    <Input
                      value={selectedItem.x.toFixed(2)}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-400 mb-1 block">Position Y</Label>
                    <Input
                      value={selectedItem.y.toFixed(2)}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-400 mb-1 block">Rotation</Label>
                    <div className="flex gap-1">
                      <Input
                        value={`${selectedItem.rotation}°`}
                        readOnly
                        className="bg-slate-700 border-slate-600 text-white text-xs h-7 flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 border-slate-600"
                        onClick={() => rotateItem(selectedItem.id)}
                      >
                        <RotateCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-400 mb-1 block">Wall Anchor</Label>
                    <select
                      value={selectedItem.wallAnchor}
                      onChange={(e) => updateWallAnchor(selectedItem.id, e.target.value as TemplateFurnitureItem['wallAnchor'])}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white h-7"
                    >
                      {WALL_ANCHORS.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs bg-red-700/50 hover:bg-red-700"
                    onClick={() => removeItem(selectedItem.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-600 text-slate-300"
                    onClick={() => duplicateItem(selectedItem.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </div>
            )}

            {/* Actions bar */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-500 text-xs"
                onClick={handleSave}
              >
                <Save className="w-3 h-3 mr-1" />
                Save Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-600 text-slate-300"
                onClick={() => {
                  setItems([]);
                  setSelectedItemId(null);
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Right sidebar: Catalog + Saved Templates */}
          <div className="w-64 bg-slate-850 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
            {/* Catalog sidebar */}
            <div className="p-3 border-b border-slate-800">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sofa className="w-3 h-3" />
                Catalog
              </h3>
              <p className="text-[9px] text-slate-600 mb-2">Drag items into the room</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ADMIN_CATALOG.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleCatalogDragStart(e, item)}
                    onClick={() => addItemFromCatalog(item, 0, 0)}
                    className="flex flex-col items-center gap-0.5 bg-slate-800 rounded-lg border border-slate-700 p-2 cursor-grab active:cursor-grabbing hover:border-teal-600/40 transition-colors"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[9px] text-slate-400 text-center leading-tight">{item.name}</span>
                    <span className="text-[8px] text-slate-600">{item.width}×{item.depth}m</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved templates list */}
            <div className="p-3">
              <button
                onClick={() => setShowSavedTemplates(!showSavedTemplates)}
                className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                <span>Saved Templates ({savedTemplates.length})</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showSavedTemplates ? 'rotate-180' : ''}`} />
              </button>

              {showSavedTemplates && (
                <div className="space-y-2">
                  {savedTemplates.length === 0 ? (
                    <p className="text-[10px] text-slate-600 py-4 text-center">No templates saved yet</p>
                  ) : (
                    savedTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => loadTemplate(tpl)}
                        className="bg-slate-800 rounded-lg border border-slate-700 p-2.5 cursor-pointer hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-200 font-medium truncate">{tpl.name}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${tpl.published ? 'bg-green-400' : 'bg-slate-600'}`} />
                        </div>
                        <div className="flex gap-1.5 items-center text-[9px] text-slate-500">
                          <span>{tpl.category}</span>
                          <span>·</span>
                          <span>{tpl.style}</span>
                          <span>·</span>
                          <span>{tpl.items.length} items</span>
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {tpl.items.slice(0, 4).map((item) => (
                            <span key={item.id} className="text-sm">{item.icon}</span>
                          ))}
                          {tpl.items.length > 4 && (
                            <span className="text-[8px] text-slate-600 self-center">+{tpl.items.length - 4}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-teal-600 text-white text-xs px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5" />
          {toast}
        </div>
      )}
    </div>
  );
}
