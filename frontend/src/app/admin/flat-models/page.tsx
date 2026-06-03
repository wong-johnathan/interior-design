'use client';

import { useState } from 'react';
import {
  Search,
  Home,
  Building2,
  Ruler,
  Grid,
  DoorOpen,
  ArrowUpRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ───────── Mock data ───────── */
const MOCK_MODELS = [
  { id: 'm1', name: '4-Room Model A', project: 'Verandah Kallang 2024', flatType: '4-room', area: 90, walls: 14, rooms: 4, status: 'published' as const },
  { id: 'm2', name: '4-Room Model B', project: 'Verandah Kallang 2024', flatType: '4-room', area: 92, walls: 15, rooms: 4, status: 'published' as const },
  { id: 'm3', name: '5-Room Model A', project: 'Verandah Kallang 2024', flatType: '5-room', area: 110, walls: 18, rooms: 5, status: 'published' as const },
  { id: 'm4', name: '3-Room Model A', project: 'Verandah Kallang 2024', flatType: '3-room', area: 68, walls: 11, rooms: 3, status: 'published' as const },
  { id: 'm5', name: '4-Room Model A', project: 'Queenstown Project 2024', flatType: '4-room', area: 90, walls: 14, rooms: 4, status: 'published' as const },
  { id: 'm6', name: '5-Room Model A', project: 'Queenstown Project 2024', flatType: '5-room', area: 108, walls: 17, rooms: 5, status: 'draft' as const },
  { id: 'm7', name: '4-Room Model A', project: 'Tampines Greenwalk 2025', flatType: '4-room', area: 90, walls: 0, rooms: 0, status: 'draft' as const },
  { id: 'm8', name: '5-Room Model B', project: 'Tampines Greenwalk 2025', flatType: '5-room', area: 112, walls: 0, rooms: 0, status: 'draft' as const },
  { id: 'm9', name: '4-Room Model A', project: 'Bukit Batok Hillside 2025', flatType: '4-room', area: 90, walls: 0, rooms: 0, status: 'draft' as const },
  { id: 'm10', name: '4-Room Model A', project: 'Clementi Ridges 2025', flatType: '4-room', area: 90, walls: 0, rooms: 0, status: 'coming-soon' as const },
];

/* ───────── Wall detail mock (shown in modal) ───────── */
const MOCK_WALL_DETAILS = [
  { id: 'w1', type: 'structural', label: 'Wall 1', length: '4.2m', connects: 'Living — Master Bedroom' },
  { id: 'w2', type: 'structural', label: 'Wall 2', length: '3.8m', connects: 'Living — Kitchen' },
  { id: 'w3', type: 'interior', label: 'Wall 3', length: '2.5m', connects: 'Master Bedroom — Bathroom 1' },
  { id: 'w4', type: 'interior', label: 'Wall 4', length: '2.1m', connects: 'Bedroom 2 — Bathroom 2' },
  { id: 'w5', type: 'interior', label: 'Wall 5', length: '3.0m', connects: 'Kitchen — Living Room' },
  { id: 'w6', type: 'opening', label: 'Door 1', length: '0.9m', connects: 'Living — Hallway' },
  { id: 'w7', type: 'opening', label: 'Window 1', length: '1.5m', connects: 'Living — Exterior' },
  { id: 'w8', type: 'opening', label: 'Window 2', length: '1.2m', connects: 'Master Bedroom — Exterior' },
];

const STATUS_STYLES: Record<string, string> = {
  'published': 'bg-green-100 text-green-700 border-green-200',
  'draft': 'bg-slate-100 text-slate-600 border-slate-200',
  'coming-soon': 'bg-amber-100 text-amber-700 border-amber-200',
};

const WALL_TYPE_COLORS: Record<string, string> = {
  structural: 'bg-slate-800',
  interior: 'bg-amber-500',
  opening: 'bg-blue-400',
};

const WALL_TYPE_LABELS: Record<string, string> = {
  structural: 'Structural Wall',
  interior: 'Interior Wall',
  opening: 'Door/Window Opening',
};

/* ───────── Component ───────── */
export default function FlatModelsPage() {
  const [search, setSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState<typeof MOCK_MODELS[0] | null>(null);
  const [showWallDetail, setShowWallDetail] = useState(false);

  const filtered = MOCK_MODELS.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.project.toLowerCase().includes(q) ||
      m.flatType.toLowerCase().includes(q)
    );
  });

  const openWallDetail = (model: typeof MOCK_MODELS[0]) => {
    setSelectedModel(model);
    setShowWallDetail(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Flat Models</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage flat models across all BTO projects
        </p>
      </div>

      {/* Search & filter */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by model name, project or type..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-slate-400 font-medium ml-auto">
              {filtered.length} of {MOCK_MODELS.length} models
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Model cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((model) => {
          const hasWalls = model.walls > 0;
          return (
            <Card
              key={model.id}
              className="border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => openWallDetail(model)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{model.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {model.project}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[model.status]}`}>
                    {model.status === 'coming-soon' ? 'Coming Soon' : model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{model.flatType}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" />
                    <span>{model.area} sqm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-slate-400" />
                    <span className={hasWalls ? 'text-slate-700' : 'text-slate-400'}>
                      {model.walls} walls
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span className={model.rooms > 0 ? 'text-slate-700' : 'text-slate-400'}>
                      {model.rooms} rooms
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {hasWalls ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600">Walls drawn</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-amber-600">No walls yet</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                    View Walls <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Home className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No flat models found matching your search.</p>
        </div>
      )}

      {/* ────────────── Wall Details Modal ────────────── */}
      {showWallDetail && selectedModel && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-semibold text-slate-800">{selectedModel.name}</h2>
                <p className="text-xs text-slate-400">{selectedModel.project} · {selectedModel.area} sqm · {selectedModel.flatType}</p>
              </div>
              <button
                onClick={() => setShowWallDetail(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Wall stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-700">{selectedModel.walls}</div>
                  <div className="text-xs text-slate-500">Total Walls</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-700">{MOCK_WALL_DETAILS.filter(w => w.type === 'structural').length}</div>
                  <div className="text-xs text-slate-500">Structural</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-700">{selectedModel.rooms}</div>
                  <div className="text-xs text-slate-500">Detected Rooms</div>
                </div>
              </div>

              {/* Wall list */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Wall Details</h3>
                {MOCK_WALL_DETAILS.map((wall) => (
                  <div
                    key={wall.id}
                    className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium ${
                        wall.type === 'structural' ? 'bg-slate-700' :
                        wall.type === 'interior' ? 'bg-amber-500' : 'bg-blue-400'
                      }`}>
                        {wall.type === 'opening' ? 'D' : 'W'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">{wall.label}</div>
                        <div className="text-xs text-slate-400">{wall.connects}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{wall.length}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        wall.type === 'structural' ? 'bg-slate-100 text-slate-600' :
                        wall.type === 'interior' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {WALL_TYPE_LABELS[wall.type]}
                      </span>
                      <button className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <button className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Model
                </button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-slate-300" onClick={() => setShowWallDetail(false)}>
                    Close
                  </Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit Walls
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
