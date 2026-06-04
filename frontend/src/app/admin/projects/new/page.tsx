'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Upload,
  Grid,
  Wand2,
  Palette,
  Eye,
  FileText,
  Home,
  Layers,
  Ruler,
  DoorOpen,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import { useFloorPlanStore, DetectedRoom, nextWallId } from '@/stores/floorPlanStore';

const AdminFloorPlanCanvas = dynamic(
  () => import('@/components/admin/AdminFloorPlanCanvas').then((mod) => ({ default: mod.AdminFloorPlanCanvas })),
  { ssr: false }
);

/* ───────── Step definitions ───────── */
const STEPS = [
  { id: 'details',    label: 'Project Details',     icon: FileText },
  { id: 'flat-model', label: 'Add Flat Model',       icon: Home },
  { id: 'draw-walls', label: 'Draw Walls',           icon: Grid },
  { id: 'detect',     label: 'Auto-Detect Rooms',    icon: Wand2 },
  { id: 'defaults',   label: 'Set Defaults',         icon: Palette },
  { id: 'preview',    label: 'Preview & Publish',    icon: Eye },
];

/* ───────── Room data for defaults step ───────── */
const WALL_COLORS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#F5F5DC', label: 'Beige' },
  { value: '#E8D5B7', label: 'Warm Beige' },
  { value: '#B8D4E3', label: 'Light Blue' },
  { value: '#D4E8D0', label: 'Sage Green' },
  { value: '#F0E0D0', label: 'Cream' },
];
const FLOOR_TYPES = ['Laminate', 'Vinyl', 'Tile', 'Parquet', 'Marble'];
const FLOOR_COLORS = [
  { value: '#C4A882', label: 'Oak' },
  { value: '#8B7355', label: 'Walnut' },
  { value: '#D2B48C', label: 'Tan' },
  { value: '#A0926B', label: 'Birch' },
  { value: '#6B4226', label: 'Dark Wood' },
  { value: '#E8E0D0', label: 'Light Stone' },
];

/* ───────── localStorage helpers ───────── */
const STORAGE_KEY = 'hdb_admin_projects';

interface SavedProject {
  id: string;
  name: string;
  slug: string;
  location: string;
  launchYear: string;
  description: string;
  heroImage: string | null;
  modelName: string;
  flatType: string;
  totalArea: string;
  floorPlan: string | null;
  walls: any[];
  rooms: { id: string; label: string; area: number }[];
  roomDefaults: Record<string, { wallColor: string; floorType: string; floorColor: string }>;
  roomRenames: Record<string, string>;
  status: 'draft' | 'published';
  createdAt: string;
}

function loadProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProject(project: SavedProject) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/* ───────── Main Component ───────── */
export default function NewBTOProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Step 1
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [launchYear, setLaunchYear] = useState('2025');
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState<string | null>(null);

  // Step 2
  const [modelName, setModelName] = useState('');
  const [flatType, setFlatType] = useState('4-room');
  const [totalArea, setTotalArea] = useState('90');
  const [floorPlan, setFloorPlan] = useState<string | null>(null);

  // Detected rooms (synced from store via callback)
  const [detectedRooms, setDetectedRooms] = useState<DetectedRoom[]>([]);

  // Renamed rooms
  const [renamedRooms, setRenamedRooms] = useState<Record<string, string>>({});

  // Room defaults (Step 5)
  const [roomDefaults, setRoomDefaults] = useState<Record<string, { wallColor: string; floorType: string; floorColor: string }>>({});
  const [defaultsInitialized, setDefaultsInitialized] = useState(false);

  // Store access for saving wall data
  const walls = useFloorPlanStore((s) => s.walls);
  const rooms = useFloorPlanStore((s) => s.rooms);
  const resetStore = useFloorPlanStore((s) => s.reset);

  // Initialize defaults when rooms are first detected
  useEffect(() => {
    if (detectedRooms.length > 0 && !defaultsInitialized) {
      const defaults: Record<string, { wallColor: string; floorType: string; floorColor: string }> = {};
      detectedRooms.forEach((r) => {
        defaults[r.id] = { wallColor: '#FFFFFF', floorType: 'Laminate', floorColor: '#C4A882' };
      });
      setRoomDefaults(defaults);
      setDefaultsInitialized(true);
    }
  }, [detectedRooms, defaultsInitialized]);

  // Room detection callback
  const handleRoomsDetected = useCallback((detected: DetectedRoom[]) => {
    setDetectedRooms(detected);
  }, []);

  // Navigate to Step 4
  const goToDetect = () => {
    if (walls.length < 3) {
      setToast({ type: 'error', msg: 'Draw at least 3 wall segments before detecting rooms.' });
      return;
    }
    setCurrentStep(3);
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    // Step 2 → 3: must have model name
    if (currentStep === 1 && !modelName) {
      setToast({ type: 'error', msg: 'Please enter a model name before proceeding.' });
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleRenameRoom = (id: string, newName: string) => {
    setRenamedRooms((prev) => ({ ...prev, [id]: newName }));
  };

  const handleDefaultChange = (roomId: string, field: string, value: string) => {
    setRoomDefaults((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value },
    }));
  };

  const handleImageUpload = (setter: (val: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setter(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // ── Save Draft ──
  const handleSaveDraft = () => {
    const project: SavedProject = {
      id: `proj_${Date.now()}`,
      name: projectName || 'Untitled Project',
      slug: projectSlug || 'untitled-project',
      location: projectLocation,
      launchYear,
      description,
      heroImage,
      modelName,
      flatType,
      totalArea,
      floorPlan,
      walls: walls.map((w) => ({ ...w })),
      rooms: rooms.map((r) => ({ id: r.id, label: r.label, area: r.area })),
      roomDefaults,
      roomRenames: renamedRooms,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    saveProject(project);
    setToast({ type: 'success', msg: `Project "${project.name}" saved as draft!` });
  };

  // ── Publish ──
  const handlePublish = () => {
    if (!projectName || !modelName) {
      setToast({ type: 'error', msg: 'Project name and model name are required.' });
      return;
    }
    const project: SavedProject = {
      id: `proj_${Date.now()}`,
      name: projectName,
      slug: projectSlug,
      location: projectLocation,
      launchYear,
      description,
      heroImage,
      modelName,
      flatType,
      totalArea,
      floorPlan,
      walls: walls.map((w) => ({ ...w })),
      rooms: rooms.map((r) => ({ id: r.id, label: r.label, area: r.area })),
      roomDefaults,
      roomRenames: renamedRooms,
      status: 'published',
      createdAt: new Date().toISOString(),
    };
    saveProject(project);
    resetStore();
    setToast({ type: 'success', msg: `Project "${project.name}" published! Redirecting...` });
    setTimeout(() => router.push('/admin/projects'), 1500);
  };

  // ── Show toast ──
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ────────────────── Step content renderers ────────────────── */

  const renderStep1 = () => (
    <div className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name *</label>
        <input
          type="text"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
          placeholder="e.g. Verandah Kallang 2024"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            if (!projectSlug) setProjectSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 font-mono"
            placeholder="verandah-kallang-2024"
            value={projectSlug}
            onChange={(e) => setProjectSlug(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Launch Year</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
            value={launchYear}
            onChange={(e) => setLaunchYear(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
        <input
          type="text"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
          placeholder="e.g. Kallang"
          value={projectLocation}
          onChange={(e) => setProjectLocation(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 h-24 resize-none"
          placeholder="Project description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Hero Image</label>
        {heroImage ? (
          <div className="relative rounded-lg overflow-hidden border border-slate-200 w-full max-w-sm h-40">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
            <button
              onClick={() => setHeroImage(null)}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-xs text-slate-600 hover:text-red-500"
            >✕</button>
          </div>
        ) : (
          <div
            onClick={() => handleImageUpload(setHeroImage)}
            className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors max-w-sm"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">Click to upload hero image</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Model Name *</label>
        <input
          type="text"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
          placeholder="e.g. 4-Room Model A"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Flat Type</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 bg-white"
            value={flatType}
            onChange={(e) => setFlatType(e.target.value)}
          >
            <option value="2-room-flexi">2-Room Flexi</option>
            <option value="3-room">3-Room</option>
            <option value="4-room">4-Room</option>
            <option value="5-room">5-Room</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Area (sqm)</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
            value={totalArea}
            onChange={(e) => setTotalArea(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Floor Plan</label>
        {floorPlan ? (
          <div className="relative rounded-lg overflow-hidden border border-slate-200 w-full max-w-sm h-48">
            <img src={floorPlan} alt="Floor Plan" className="w-full h-full object-contain bg-slate-50" />
            <button
              onClick={() => setFloorPlan(null)}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-xs text-slate-600 hover:text-red-500"
            >✕</button>
          </div>
        ) : (
          <div
            onClick={() => handleImageUpload(setFloorPlan)}
            className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors max-w-sm"
          >
            <Upload className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">Click to upload floor plan</p>
            <p className="text-xs text-slate-400 mt-1">PDF, PNG, SVG accepted</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 mb-3">
        Click <strong>Draw</strong> tool, then click on the canvas to place wall endpoints.
        Each click adds a wall segment. Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Esc</kbd> to stop drawing.
      </p>
      <AdminFloorPlanCanvas onRoomsDetected={handleRoomsDetected} />
      <div className="flex justify-end">
        <Button
          onClick={goToDetect}
          disabled={walls.length < 3}
          className="bg-amber-600 hover:bg-amber-500 text-white"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Auto-Detect Rooms ({rooms.length} found)
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5 max-w-2xl">
      {detectedRooms.length === 0 ? (
        <div className="text-center py-12">
          <Wand2 className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Rooms Detected</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Draw walls first in Step 3, then the system will auto-detect rooms.
          </p>
          <Button onClick={() => setCurrentStep(2)} className="bg-amber-600 hover:bg-amber-500 text-white">
            Go to Draw Walls
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-base font-semibold text-slate-700">
              {detectedRooms.length} rooms detected
            </h3>
            <Badge className="bg-green-100 text-green-700 border-green-200 ml-auto">
              Auto-detection complete
            </Badge>
          </div>

          <div className="space-y-2">
            {detectedRooms.map((room) => {
              const rn = renamedRooms[room.id] ?? room.label;
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-amber-500" />
                    <input
                      type="text"
                      className="text-sm font-medium text-slate-700 border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none px-1 py-0.5 bg-transparent"
                      value={rn}
                      onChange={(e) => handleRenameRoom(room.id, e.target.value)}
                      placeholder={room.label}
                    />
                    <Pencil className="w-3 h-3 text-slate-300" />
                    <span className="text-xs text-slate-400">{room.area.toFixed(1)} sqm</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600 font-medium">Auto-detected</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Click the pencil icon to rename any room. All detections are based on your wall layout.
          </p>
        </>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5 max-w-3xl">
      {detectedRooms.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Palette className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Please complete room detection first (Step 4).</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Configure default finishes for each room. Users can customize these later.</p>
          {detectedRooms.map((room) => {
            const rn = renamedRooms[room.id] ?? room.label;
            const defs = roomDefaults[room.id];
            return (
              <Card key={room.id} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
                    <Home className="w-4 h-4 text-amber-500" />
                    {rn}
                    <span className="text-xs text-slate-400 font-normal">({room.area.toFixed(1)} sqm)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Wall Color</label>
                      <div className="flex gap-2">
                        {WALL_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => handleDefaultChange(room.id, 'wallColor', c.value)}
                            className={`w-7 h-7 rounded-full border-2 ${
                              defs?.wallColor === c.value ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Floor Type</label>
                      <select
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                        value={defs?.floorType || 'Laminate'}
                        onChange={(e) => handleDefaultChange(room.id, 'floorType', e.target.value)}
                      >
                        {FLOOR_TYPES.map((ft) => (
                          <option key={ft} value={ft}>{ft}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Floor Color</label>
                      <div className="flex gap-2">
                        {FLOOR_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => handleDefaultChange(room.id, 'floorColor', c.value)}
                            className={`w-7 h-7 rounded-full border-2 ${
                              defs?.floorColor === c.value ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700">Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Field</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">Project</td>
                  <td className="px-5 py-3 font-medium text-slate-700">{projectName || <span className="text-slate-300">—</span>}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">Model</td>
                  <td className="px-5 py-3 text-slate-700">{modelName || <span className="text-slate-300">—</span>}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">Flat Type</td>
                  <td className="px-5 py-3 capitalize text-slate-700">{flatType}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">Walls Drawn</td>
                  <td className="px-5 py-3">
                    <Badge className={walls.length > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                      {walls.length} walls
                    </Badge>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">Rooms Detected</td>
                  <td className="px-5 py-3">
                    <Badge className={detectedRooms.length > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                      {detectedRooms.length} rooms
                    </Badge>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">Defaults Configured</td>
                  <td className="px-5 py-3">
                    <Badge className={Object.keys(roomDefaults).length > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                      {Object.keys(roomDefaults).length} rooms
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3D Preview placeholder */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700">3D Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-48 flex items-center justify-center border border-slate-200">
            <div className="text-center text-slate-400">
              <Eye className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">3D Preview</p>
              <p className="text-xs text-slate-400 mt-1">Interactive 3D view will render here</p>
              {(projectName || modelName) && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  {projectName} — {modelName || 'Flat Model'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" className="border-slate-300" onClick={handleSaveDraft}>
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button className="bg-amber-600 hover:bg-amber-500 text-white" onClick={handlePublish}>
          <Check className="w-4 h-4 mr-2" />
          Publish Project
        </Button>
      </div>
    </div>
  );

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div>
        <button
          onClick={() => router.push('/admin/projects')}
          className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <h1 className="text-xl font-bold text-slate-800">New BTO Project</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create a new BTO project with floor plans and room defaults</p>
      </div>

      <div className="flex gap-8">
        {/* ─── Left sidebar: Step indicator ─── */}
        <div className="w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            {STEPS.map((step, i) => {
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : isCompleted
                      ? 'text-slate-500 hover:bg-slate-100 cursor-pointer'
                      : 'text-slate-300 cursor-default'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-amber-600 text-white'
                      : isActive
                      ? 'border-2 border-amber-600 text-amber-600'
                      : 'border-2 border-slate-200 text-slate-300'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <StepIcon className={`w-4 h-4 shrink-0 ${
                      isCompleted ? 'text-amber-600' : isActive ? 'text-amber-600' : 'text-slate-300'
                    }`} />
                    <span className="truncate">{step.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Right: Step content ─── */}
        <div className="flex-1 min-w-0">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-slate-800">
                    Step {currentStep + 1}: {STEPS[currentStep].label}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentStep === 0 && 'Enter the basic details for the BTO project.'}
                    {currentStep === 1 && 'Add a flat model with type and floor plan.'}
                    {currentStep === 2 && 'Draw structural and interior walls on the floor plan.'}
                    {currentStep === 3 && 'Review auto-detected rooms from the drawn walls.'}
                    {currentStep === 4 && 'Set default wall colors, floor types, and floor colors per room.'}
                    {currentStep === 5 && 'Preview the project and publish or save as draft.'}
                  </p>
                </div>
                <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">
                  Step {currentStep + 1} of {STEPS.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {stepRenderers[currentStep]()}
            </CardContent>
          </Card>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-5">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirst}
              className="border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {!isLast ? (
              <Button onClick={handleNext} className="bg-amber-600 hover:bg-amber-500 text-white">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="border-slate-300" onClick={handleSaveDraft}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-500 text-white" onClick={handlePublish}>
                  <Check className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
