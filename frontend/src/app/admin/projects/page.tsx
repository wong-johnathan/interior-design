'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Building2, MapPin, Calendar, Layers, ArrowUpRight, Trash2,
  ChevronLeft, PencilRuler, Wand2, Palette, Eye, CheckCircle2, X, Upload,
  Home, Maximize2, RotateCcw, Save, Download, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFloorPlanStore } from '@/stores/floorPlanStore';
import dynamic from 'next/dynamic';

// Dynamic import for Konva canvas (client-only)
const AdminFloorPlanCanvas = dynamic(
  () => import('@/components/admin/AdminFloorPlanCanvas').then((mod) => mod.AdminFloorPlanCanvas),
  { ssr: false }
);

// ───── Project list types ─────

const STORAGE_KEY = 'hdb_admin_projects';

interface Project {
  id: string;
  name: string;
  slug: string;
  location: string;
  launchYear: string;
  status: 'draft' | 'published';
  createdAt: string;
  modelName?: string;
  modelCount?: number;
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Verandah Kallang 2024', slug: 'verandah-kallang-2024', location: 'Kallang', launchYear: '2024', status: 'published', createdAt: '2024-06-01', modelCount: 4 },
  { id: '2', name: 'Queenstown Project 2024', slug: 'queenstown-project-2024', location: 'Queenstown', launchYear: '2024', status: 'published', createdAt: '2024-05-15', modelCount: 3 },
  { id: '3', name: 'Clementi Ridges 2025', slug: 'clementi-ridges-2025', location: 'Clementi', launchYear: '2025', status: 'published', createdAt: '2025-01-10', modelCount: 1 },
  { id: '4', name: 'Tampines Greenwalk 2025', slug: 'tampines-greenwalk-2025', location: 'Tampines', launchYear: '2025', status: 'draft', createdAt: '2025-02-20', modelCount: 3 },
  { id: '5', name: 'Bukit Batok Hillside 2025', slug: 'bukit-batok-hillside-2025', location: 'Bukit Batok', launchYear: '2025', status: 'draft', createdAt: '2025-03-05', modelCount: 2 },
  { id: '6', name: 'Woodlands North Shore', slug: 'woodlands-north-shore-2024', location: 'Woodlands', launchYear: '2024', status: 'published', createdAt: '2024-08-12', modelCount: 5 },
  { id: '7', name: 'Bedok South Horizon', slug: 'bedok-south-horizon-2025', location: 'Bedok', launchYear: '2025', status: 'published', createdAt: '2025-04-01', modelCount: 3 },
  { id: '8', name: 'Jurong Lake District', slug: 'jurong-lake-district-2026', location: 'Jurong', launchYear: '2026', status: 'draft', createdAt: '2026-01-15', modelCount: 0 },
];

function loadSavedProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const saved: any[] = JSON.parse(raw);
    return saved.map((p) => ({
      id: p.id, name: p.name, slug: p.slug,
      location: p.location || '', launchYear: p.launchYear || '',
      status: p.status || 'draft',
      createdAt: p.createdAt || new Date().toISOString(),
      modelName: p.modelName, modelCount: 1,
    }));
  } catch { return []; }
}

const STATUS_STYLES: Record<string, string> = {
  'published': 'bg-green-100 text-green-700 border-green-200',
  'draft': 'bg-slate-100 text-slate-600 border-slate-200',
};

// ───── Room Detection Algorithm (client-side) ─────

interface Room {
  id: string;
  name: string;
  area: number;
  walls: string[];
}

interface WallSeg {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  type: 'external' | 'party' | 'load-bearing' | 'internal';
}

const ROOM_NAMES = ['Living Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4', 'Kitchen', 'Bathroom', 'Bathroom 2', 'Common Bathroom', 'Utility Room', 'Bomb Shelter', 'Study', 'Hallway', 'Dining Room', 'Store Room'];

function detectRooms(walls: WallSeg[], PPM: number): Room[] {
  if (walls.length < 3) return [];

  const junctions = new Map<string, WallSeg[]>();
  const key = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`;

  for (const w of walls) {
    const k1 = key(w.x1, w.y1), k2 = key(w.x2, w.y2);
    if (!junctions.has(k1)) junctions.set(k1, []);
    if (!junctions.has(k2)) junctions.set(k2, []);
    junctions.get(k1)!.push(w);
    junctions.get(k2)!.push(w);
  }

  const visitedEdges = new Set<string>();
  const rooms: Room[] = [];

  for (const [jnk, jnWalls] of junctions) {
    if (jnWalls.length < 2) continue;

    for (const startWall of jnWalls) {
      const eid = startWall.id;
      if (visitedEdges.has(eid)) continue;

      const cycle: WallSeg[] = [];
      let currentJunction = jnk;
      let currentWall = startWall;
      let iterations = 0;

      while (iterations < 200) {
        iterations++;
        if (cycle.find(w => w.id === currentWall.id)) break;
        cycle.push(currentWall);
        visitedEdges.add(currentWall.id);

        const [cx, cy] = currentJunction.split(',').map(Number);
        const nextX = Math.abs(currentWall.x1 - cx) < 1 ? currentWall.x2 : currentWall.x1;
        const nextY = Math.abs(currentWall.y1 - cy) < 1 ? currentWall.y2 : currentWall.y1;
        const nextKey = key(nextX, nextY);

        const neighborWalls = (junctions.get(nextKey) || []).filter(w => w.id !== currentWall.id);
        if (neighborWalls.length === 0) break;

        const dx = nextX - cx, dy = nextY - cy;
        const incomingAngle = Math.atan2(dy, dx);

        let bestWall = neighborWalls[0];
        let bestAngle = -Infinity;

        for (const nw of neighborWalls) {
          const nwx = Math.abs(nw.x1 - nextX) < 1 ? nw.x2 : nw.x1;
          const nwy = Math.abs(nw.y1 - nextY) < 1 ? nw.y2 : nw.y1;
          const outAngle = Math.atan2(nwy - nextY, nwx - nextX);
          let turn = outAngle - incomingAngle;
          if (turn <= 0) turn += Math.PI * 2;
          if (turn > bestAngle) {
            bestAngle = turn;
            bestWall = nw;
          }
        }

        currentWall = bestWall;
        currentJunction = nextKey;
      }

      if (cycle.length >= 3) {
        const vertices: { x: number; y: number }[] = [];
        for (const w of cycle) {
          const v = vertices.length === 0
            ? { x: w.x1, y: w.y1 }
            : { x: w.x2, y: w.y2 };
          if (!vertices.some(p => Math.abs(p.x - v.x) < 1 && Math.abs(p.y - v.y) < 1)) {
            vertices.push(v);
          }
        }

        if (vertices.length >= 3) {
          let area = 0;
          for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            area += vertices[i].x * vertices[j].y;
            area -= vertices[j].x * vertices[i].y;
          }
          area = Math.abs(area) / 2;

          const bounds = vertices.reduce((b, v) => ({
            minX: Math.min(b.minX, v.x), maxX: Math.max(b.maxX, v.x),
            minY: Math.min(b.minY, v.y), maxY: Math.max(b.maxY, v.y),
          }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
          const outerArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);

          const areaM2 = area / (PPM * PPM);
          const outerAreaM2 = outerArea / (PPM * PPM);

          if (areaM2 < outerAreaM2 * 0.85) {
            rooms.push({
              id: `room-${Date.now()}-${rooms.length}`,
              name: ROOM_NAMES[rooms.length % ROOM_NAMES.length],
              area: Math.round(areaM2 * 10) / 10,
              walls: cycle.map(w => w.id),
            });
          }
        }
      }
    }
  }

  return rooms;
}

// ───── Wizard Steps ─────

const WIZARD_STEPS = [
  { id: 'walls', label: 'Floor Plan', icon: PencilRuler },
  { id: 'rooms', label: 'Detect Rooms', icon: Wand2 },
  { id: 'style', label: 'Style Defaults', icon: Palette },
  { id: 'model', label: '3D Preview', icon: Eye },
  { id: 'publish', label: 'Publish', icon: CheckCircle2 },
];

interface FormData {
  projectName: string;
  location: string;
  launchYear: string;
  slug: string;
}

// ───── Isometric SVG Preview ─────

function IsometricFloorPlanPreview({ walls: rawWalls, rooms, PPM }: { walls: { id: string; startX: number; startY: number; endX: number; endY: number }[]; rooms: Room[]; PPM: number }) {
  const walls = rawWalls.map((w) => ({
    id: w.id, x1: w.startX, y1: w.startY, x2: w.endX, y2: w.endY,
  }));
  if (walls.length === 0) return null;

  const pad = 40;
  const bounds = walls.reduce((b, w) => ({
    minX: Math.min(b.minX, w.x1, w.x2),
    maxX: Math.max(b.maxX, w.x1, w.x2),
    minY: Math.min(b.minY, w.y1, w.y2),
    maxY: Math.max(b.maxY, w.y1, w.y2),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(140 / w, 100 / h);

  const iso = (x: number, y: number) => {
    const px = (x - bounds.minX) * scale;
    const py = (y - bounds.minY) * scale;
    return {
      sx: pad + (px - py) * 0.5,
      sy: pad + (px + py) * 0.25,
    };
  };

  const roomColors = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#e0e7ff', '#f0fdf4', '#fef2f2', '#f5f5f4', '#ffedd5', '#f0f9ff'];

  return (
    <svg width={pad * 2 + Math.max(w, h) * scale} height={pad * 2 + Math.max(w, h) * scale * 0.5} className="w-full max-w-[220px] h-auto">
      {rooms.map((room, i) => {
        const roomWalls = walls.filter(w => room.walls.includes(w.id));
        if (roomWalls.length < 3) return null;
        const pts = roomWalls.map(w => {
          const p1 = iso(w.x1, w.y1);
          return `${p1.sx},${p1.sy}`;
        });
        return <polygon key={room.id} points={pts.join(' ')} fill={roomColors[i % roomColors.length]} stroke="#94a3b8" strokeWidth="1" />;
      })}
      {walls.map((w) => {
        const p1 = iso(w.x1, w.y1);
        const p2 = iso(w.x2, w.y2);
        return <line key={w.id} x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#475569" strokeWidth="2" strokeLinecap="round" />;
      })}
    </svg>
  );
}

// ───── Main Page ─────

export default function AdminProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showCreationWizard, setShowCreationWizard] = useState(false);

  // ── Wizard state ──
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    projectName: '',
    location: '',
    launchYear: '2025',
    slug: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Floor plan store
  const walls = useFloorPlanStore((s) => s.walls);
  const setWalls = useFloorPlanStore((s) => s.setWalls);
  const reset = useFloorPlanStore((s) => s.reset);

  // Detection results
  const [detectedRooms, setDetectedRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomColors, setRoomColors] = useState<Record<string, string>>({});
  const [roomFloorTypes, setRoomFloorTypes] = useState<Record<string, string>>({});

  const PPM = 80; // pixels per metre

  useEffect(() => {
    const saved = loadSavedProjects();
    setAllProjects([...MOCK_PROJECTS, ...saved]);
  }, []);

  // Update slug when project name changes
  const handleFormChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'projectName') {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
  }, []);

  // Auto-detect rooms
  const handleAutoDetect = useCallback(() => {
    const wallSegs: WallSeg[] = walls.map((w) => ({
      id: w.id,
      x1: w.startX, y1: w.startY,
      x2: w.endX, y2: w.endY,
      type: w.isLoadBearing ? 'load-bearing' : (w.wallType === 'party' ? 'party' : w.wallType),
    }));
    const rooms = detectRooms(wallSegs, PPM);
    setDetectedRooms(rooms);

    const colors: Record<string, string> = {};
    const floors: Record<string, string> = {};
    const defaultColors = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#e0e7ff', '#f0fdf4', '#fef2f2', '#f5f5f4'];
    const defaultFloors = ['vinyl_oak', 'vinyl_grey', 'porcelain', 'laminate_oak', 'carpet', 'tile_white', 'tile_grey', 'vinyl_wood'];

    rooms.forEach((r, i) => {
      colors[r.id] = defaultColors[i % defaultColors.length];
      floors[r.id] = defaultFloors[i % defaultFloors.length];
    });
    setRoomColors(colors);
    setRoomFloorTypes(floors);
  }, [walls]);

  // Publish
  const handlePublish = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newProject: Project = {
        id: `saved-${Date.now()}`,
        name: form.projectName || 'Untitled Project',
        slug: form.slug || 'untitled',
        location: form.location || '',
        launchYear: form.launchYear || '2025',
        status: 'published',
        createdAt: new Date().toISOString(),
        modelName: `${form.projectName} - ${detectedRooms.length} rooms`,
        modelCount: detectedRooms.length,
      };

      const saved = loadSavedProjects();
      saved.unshift(newProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setAllProjects(prev => [newProject, ...prev]);

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setShowCreationWizard(false);
        setCurrentStep(0);
        reset();
        setDetectedRooms([]);
        setForm({ projectName: '', location: '', launchYear: '2025', slug: '' });
      }, 1500);
    }, 800);
  }, [form, detectedRooms, reset]);

  // Show wall count fallback
  const wallCountText = walls.length > 0
    ? `${walls.length} wall${walls.length !== 1 ? 's' : ''} drawn`
    : 'No walls yet';

  // ── Filtered projects for list view ──
  const filtered = allProjects.filter((p) => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    const saved = loadSavedProjects();
    const filtered = saved.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    setAllProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Wizard Steps ──

  const renderStep = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'walls':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Draw Floor Plan</h3>
                <p className="text-xs text-slate-500">Click on the canvas to place wall points. Close a polygon to complete a room.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-slate-50">{wallCountText}</Badge>
                {walls.length > 0 && (
                  <button onClick={reset} className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                    <RotateCcw className="w-3 h-3 inline mr-1" />Clear
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white" style={{ height: 480 }}>
              <AdminFloorPlanCanvas />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-600 inline-block" /> External Wall</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-600 inline-block" /> Load-Bearing</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-600 inline-block" /> Party Wall</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-600 inline-block" /> Internal</div>
              </div>
              <div className="text-right text-xs text-slate-400">
                {walls.length > 0 ? `Bounds detected: ${walls.length} wall segments` : 'Click to place first wall point'}
              </div>
            </div>
          </div>
        );

      case 'rooms':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Room Detection</h3>
                <p className="text-xs text-slate-500">Auto-detect rooms from your floor plan, then assign names and adjust properties.</p>
              </div>
              <Button
                onClick={handleAutoDetect}
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-white"
                disabled={walls.length < 3}
              >
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                Auto-Detect Rooms
              </Button>
            </div>

            {walls.length < 3 && (
              <Card className="border-dashed border-slate-300 bg-slate-50/50">
                <CardContent className="p-6 text-center">
                  <Home className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">Draw at least 3 walls on the floor plan first</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setCurrentStep(0)}>
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Back to Floor Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {detectedRooms.length === 0 && walls.length >= 3 && (
              <Card className="border-dashed border-slate-300">
                <CardContent className="p-6 text-center">
                  <Wand2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">Click "Auto-Detect Rooms" to analyse your floor plan</p>
                </CardContent>
              </Card>
            )}

            {detectedRooms.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {detectedRooms.map((room, i) => (
                  <Card
                    key={room.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedRoomId === room.id ? 'border-amber-500 shadow-md' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roomColors[room.id] || '#e2e8f0' }} />
                        <span className="text-sm font-medium text-slate-700">{room.name}</span>
                      </div>
                      <div className="text-xs text-slate-500">{room.area} m²</div>
                      <div className="text-xs text-slate-400 mt-1">{room.walls.length} walls</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {detectedRooms.length > 0 && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
                <strong className="text-slate-700">{detectedRooms.length}</strong> rooms detected
                {' · '}
                Total area: <strong className="text-slate-700">{detectedRooms.reduce((s, r) => s + r.area, 0).toFixed(1)}</strong> m²
              </div>
            )}
          </div>
        );

      case 'style':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800">Style Defaults</h3>
              <p className="text-xs text-slate-500">Set default wall colours and floor types for each room.</p>
            </div>

            {detectedRooms.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-slate-50/50">
                <CardContent className="p-6 text-center">
                  <Palette className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">Detect rooms first to set style defaults</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {detectedRooms.map((room) => (
                  <Card key={room.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: roomColors[room.id] }} />
                          <span className="font-medium text-sm text-slate-700">{room.name}</span>
                          <span className="text-xs text-slate-400">{room.area} m²</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1.5">Wall Colour</label>
                          <div className="flex gap-1.5">
                            {['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#f0fdf4', '#fef2f2', '#f5f5f4', '#e0e7ff'].map((c) => (
                              <button
                                key={c}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${
                                  roomColors[room.id] === c ? 'border-slate-700 scale-110' : 'border-transparent hover:border-slate-300'
                                }`}
                                style={{ backgroundColor: c }}
                                onClick={() => setRoomColors(prev => ({ ...prev, [room.id]: c }))}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1.5">Floor Type</label>
                          <select
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                            value={roomFloorTypes[room.id] || 'vinyl_oak'}
                            onChange={(e) => setRoomFloorTypes(prev => ({ ...prev, [room.id]: e.target.value }))}
                          >
                            <option value="vinyl_oak">Vinyl — Oak</option>
                            <option value="vinyl_grey">Vinyl — Grey</option>
                            <option value="vinyl_wood">Vinyl — Wood</option>
                            <option value="porcelain">Porcelain Tile</option>
                            <option value="laminate_oak">Laminate — Oak</option>
                            <option value="carpet">Carpet</option>
                            <option value="tile_white">Ceramic — White</option>
                            <option value="tile_grey">Ceramic — Grey</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'model':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800">3D Preview</h3>
              <p className="text-xs text-slate-500">Isometric floor plan preview based on your walls and room detection.</p>
            </div>

            <Card className="border-slate-200">
              <CardContent className="p-6 flex flex-col items-center">
                {walls.length > 0 ? (
                  <>
                    <IsometricFloorPlanPreview walls={walls} rooms={detectedRooms} PPM={PPM} />
                    <div className="mt-4 text-center">
                      <div className="text-sm font-medium text-slate-700">
                        {form.projectName || 'Untitled Project'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {detectedRooms.length} rooms · {walls.length} walls
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Maximize2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No walls to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {detectedRooms.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {detectedRooms.map((room) => (
                  <div key={room.id} className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-slate-600">{room.name}</div>
                    <div className="text-xs text-slate-400">{room.area} m²</div>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{
                      backgroundColor: roomColors[room.id],
                      width: `${Math.min(100, (room.area / 40) * 100)}%`
                    }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'publish':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800">Publish Project</h3>
              <p className="text-xs text-slate-500">Review and publish your BTO project to make it available to users.</p>
            </div>

            <Card className="border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Project Name</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      placeholder="e.g., Verandah Kallang 2025"
                      value={form.projectName}
                      onChange={(e) => handleFormChange('projectName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      placeholder="e.g., Kallang"
                      value={form.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Launch Year</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-500"
                      value={form.launchYear}
                      onChange={(e) => handleFormChange('launchYear', e.target.value)}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">URL Slug</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500"
                      value={form.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="text-sm font-medium text-slate-700 mb-2">Summary</div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Walls</span>
                      <span className="font-medium">{walls.length}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Rooms</span>
                      <span className="font-medium">{detectedRooms.length}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Total Area</span>
                      <span className="font-medium">{detectedRooms.reduce((s, r) => s + r.area, 0).toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Status</span>
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Published</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep(3)} className="border-slate-300">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-500 text-white min-w-[120px]"
                onClick={handlePublish}
                disabled={isSubmitting || !form.projectName}
              >
                {isSubmitting ? (
                  <><svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Publishing...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-1.5" />Publish Project</>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render success overlay ──
  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Project Published!</h2>
          <p className="text-sm text-slate-500">"{form.projectName}" is now available to users.</p>
        </div>
      </div>
    );
  }

  // ── Creation Wizard View ──
  if (showCreationWizard) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowCreationWizard(false); setCurrentStep(0); setDetectedRooms([]); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">New BTO Project</h1>
              <p className="text-xs text-slate-500">Set up floor plan, rooms, and style defaults</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-slate-50">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </Badge>
        </div>

        {/* Step tabs */}
        <div className="flex items-center gap-0 bg-white rounded-lg border border-slate-200 p-1">
          {WIZARD_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isComplete = i < currentStep;
            return (
              <button key={step.id} onClick={() => { if (i <= currentStep + 1) setCurrentStep(i); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  isActive ? 'bg-amber-600 text-white shadow-sm' : isComplete ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-400'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            {currentStep === 0 && 'Draw the floor plan to get started'}
            {currentStep === 1 && `Rooms will appear after auto-detection`}
            {currentStep === 2 && `Esthetics aren't final — users can restyle later`}
            {currentStep === 3 && `Preview before publishing`}
            {currentStep === 4 && `Publish to make it live`}
          </div>
          <div className="flex items-center gap-2">
            {currentStep < WIZARD_STEPS.length - 1 && (
              <Button onClick={() => setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1))}
                className="bg-amber-600 hover:bg-amber-500 text-white">
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Project List View (default) ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">BTO Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all BTO projects, flat models, and floor plans</p>
        </div>
        <Button onClick={() => setShowCreationWizard(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Project
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="Search projects by name, location or slug..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <div className="text-xs text-slate-400 font-medium ml-auto">
              {filtered.length} of {allProjects.length} projects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{project.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{project.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {project.location || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {project.launchYear || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        STATUS_STYLES[project.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => router.push(`/admin/projects/${project.id}`)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5 px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                          Edit <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(project.id)}
                          className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center gap-0.5 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No projects found.</p>
              <Button onClick={() => setShowCreationWizard(true)} variant="outline" size="sm" className="mt-3">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
