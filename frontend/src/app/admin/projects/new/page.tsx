'use client';

import { useState } from 'react';
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
  Circle,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
const ROOM_TYPES = ['Living Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Kitchen', 'Bathroom 1', 'Bathroom 2'];

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

/* ───────── Mock detected rooms ───────── */
const DETECTED_ROOMS = [
  { id: 'r1', name: 'Living Room', area: '32.5 sqm', confidence: 98 },
  { id: 'r2', name: 'Master Bedroom', area: '18.2 sqm', confidence: 96 },
  { id: 'r3', name: 'Bedroom 2', area: '12.0 sqm', confidence: 94 },
  { id: 'r4', name: 'Kitchen', area: '8.5 sqm', confidence: 97 },
  { id: 'r5', name: 'Bathroom 1', area: '4.2 sqm', confidence: 95 },
  { id: 'r6', name: 'Bathroom 2', area: '3.8 sqm', confidence: 93 },
];

/* ───────── Main Component ───────── */
export default function NewBTOProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [renamedRooms, setRenamedRooms] = useState<Record<string, string>>({});

  // Step 1: Project Details state
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [launchYear, setLaunchYear] = useState('2025');
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState<string | null>(null);

  // Step 2: Flat Model state
  const [modelName, setModelName] = useState('');
  const [flatType, setFlatType] = useState('4-room');
  const [totalArea, setTotalArea] = useState('90');
  const [floorPlan, setFloorPlan] = useState<string | null>(null);

  // Step 4: Auto-detect rooms
  const [detected, setDetected] = useState(false);

  // Step 5: Defaults per room
  const [roomDefaults, setRoomDefaults] = useState<Record<string, { wallColor: string; floorType: string; floorColor: string }>>({});

  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleDetectRooms = () => {
    setDetected(true);
    // Initialize defaults for detected rooms
    const defaults: Record<string, { wallColor: string; floorType: string; floorColor: string }> = {};
    DETECTED_ROOMS.forEach((r) => {
      defaults[r.id] = { wallColor: '#FFFFFF', floorType: 'Laminate', floorColor: '#C4A882' };
    });
    setRoomDefaults(defaults);
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

  /* ────────────────── Step content renderers ────────────────── */

  const renderStep1 = () => (
    <div className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name</label>
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
            >
              ✕
            </button>
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
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Model Name</label>
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
            >
              ✕
            </button>
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
    <div className="space-y-5">
      <div className="flex gap-6">
        {/* Wall legend */}
        <Card className="border-slate-200 w-52 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Wall Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 bg-slate-800 rounded"></div>
              <span className="text-slate-600">Structural Wall</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 bg-amber-500 rounded"></div>
              <span className="text-slate-600">Interior Wall</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 bg-blue-400 rounded border-dashed" style={{ borderTop: '2px dashed #60a5fa', height: 0 }}></div>
              <span className="text-slate-600">Opening / Door</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 bg-green-400 rounded" style={{ borderTop: '2px dashed #4ade80', height: 0 }}></div>
              <span className="text-slate-600">Window</span>
            </div>
          </CardContent>
        </Card>

        {/* Tool buttons */}
        <Card className="border-slate-200 w-40 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left text-xs flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              <Pencil className="w-3.5 h-3.5" /> Draw Wall
            </button>
            <button className="w-full text-left text-xs flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <DoorOpen className="w-3.5 h-3.5 text-slate-400" /> Add Door
            </button>
            <button className="w-full text-left text-xs flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Add Window
            </button>
            <button className="w-full text-left text-xs flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Ruler className="w-3.5 h-3.5 text-slate-400" /> Measure
            </button>
          </CardContent>
        </Card>

        {/* Canvas placeholder */}
        <div className="flex-1 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center min-h-[320px]">
          <div className="text-center text-slate-400">
            <Grid className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Wall Drawing Canvas</p>
            <p className="text-xs text-slate-400 mt-1">Use tools on the left to draw walls</p>
            <p className="text-xs text-slate-300 mt-4">(react-konva canvas) — {modelName || 'Floor Plan'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5 max-w-2xl">
      {!detected ? (
        <div className="text-center py-12">
          <Wand2 className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Auto-Detect Rooms</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Our AI will scan the floor plan and automatically detect rooms, walls, doors, and windows.
          </p>
          <Button onClick={handleDetectRooms} className="bg-amber-600 hover:bg-amber-500 text-white">
            <Wand2 className="w-4 h-4 mr-2" />
            Detect Rooms
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-base font-semibold text-slate-700">
              {DETECTED_ROOMS.length} rooms detected
            </h3>
            <Badge className="bg-green-100 text-green-700 border-green-200 ml-auto">
              Auto-detection complete
            </Badge>
          </div>

          <div className="space-y-2">
            {DETECTED_ROOMS.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    className="text-sm font-medium text-slate-700 border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none px-1 py-0.5 bg-transparent"
                    value={renamedRooms[room.id] ?? room.name}
                    onChange={(e) => handleRenameRoom(room.id, e.target.value)}
                    placeholder={room.name}
                  />
                  <Pencil className="w-3 h-3 text-slate-300" />
                  <span className="text-xs text-slate-400">{room.area}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-16 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${room.confidence}%` }}
                    />
                  </div>
                  <span className="text-slate-500 font-medium">{room.confidence}%</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Click the pencil icon to rename any room. All detections can be adjusted later.
          </p>
        </>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5 max-w-3xl">
      {!detected ? (
        <div className="text-center py-12 text-slate-400">
          <Palette className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Please complete room detection first (Step 4).</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Configure default finishes for each room. Users can customize these later.</p>
          {DETECTED_ROOMS.map((room) => {
            const rn = renamedRooms[room.id] ?? room.name;
            const defs = roomDefaults[room.id];
            return (
              <Card key={room.id} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
                    <Home className="w-4 h-4 text-amber-500" />
                    {rn}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Wall Color</label>
                      <div className="flex gap-2">
                        {WALL_COLORS.slice(0, 6).map((c) => (
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
                        {FLOOR_COLORS.slice(0, 6).map((c) => (
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
      {/* 3D Preview placeholder */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700">3D Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-64 flex items-center justify-center border border-slate-200">
            <div className="text-center text-slate-400">
              <Eye className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">3D Preview</p>
              <p className="text-xs text-slate-400 mt-1">Interactive 3D view will render here</p>
              {(projectName || modelName) && (
                <p className="text-xs text-amber-600 mt-3 font-medium">
                  {projectName} — {modelName || 'Flat Model'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room summary table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700">Room Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Room</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Area</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Wall Color</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Floor</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DETECTED_ROOMS.map((room) => {
                  const rn = renamedRooms[room.id] ?? room.name;
                  const defs = roomDefaults[room.id];
                  const wallColorLabel = WALL_COLORS.find((c) => c.value === defs?.wallColor)?.label || 'White';
                  const floorColorLabel = FLOOR_COLORS.find((c) => c.value === defs?.floorColor)?.label || 'Oak';
                  return (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">{rn}</td>
                      <td className="px-5 py-3 text-slate-500">{room.area}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: defs?.wallColor }} />
                          <span className="text-slate-600 text-xs">{wallColorLabel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {defs?.floorType} — {floorColorLabel}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Configured
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" className="border-slate-300">
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button className="bg-amber-600 hover:bg-amber-500 text-white">
          <Check className="w-4 h-4 mr-2" />
          Publish Project
        </Button>
      </div>
    </div>
  );

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  return (
    <div className="space-y-6">
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
                    {currentStep === 3 && 'Let AI detect rooms automatically from the drawn walls.'}
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
                <Button variant="outline" className="border-slate-300">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-500 text-white">
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
