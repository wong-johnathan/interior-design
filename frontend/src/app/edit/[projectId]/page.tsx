'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudioBreadcrumb } from '@/components/layout/StudioBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MousePointer2, Pencil, Trash2, Undo2, Redo2, Grid3X3, Eye, RefreshCw } from 'lucide-react';

export default function EditFloorPlanPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [tool, setTool] = useState<'select' | 'draw' | 'delete'>('select');
  const [gridSnap, setGridSnap] = useState(true);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <StudioBreadcrumb
        projectName="Verandah Kallang 2024"
        projectInfo="4-Room · Model A"
        items={[
          { label: 'Design Brief', href: `/studio/${projectId}` },
          { label: 'Floor Plan', isActive: true },
          { label: 'Furniture', href: `/studio/${projectId}?tab=furniture` },
          { label: 'Renders', href: `/render/${projectId}` },
        ]}
      />

      {/* Editor Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Toolbar */}
        <div className="w-48 bg-slate-850 border-r border-slate-700 p-3 shrink-0 flex flex-col gap-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Tools
          </div>

          {[
            { id: 'select' as const, icon: MousePointer2, label: 'Select' },
            { id: 'draw' as const, icon: Pencil, label: 'Draw Wall' },
            { id: 'delete' as const, icon: Trash2, label: 'Delete' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                tool === t.id
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-600/40'
                  : 'text-slate-400 hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}

          <div className="border-t border-slate-700 my-3" />

          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-300 rounded-lg hover:bg-slate-700/50"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-300 rounded-lg hover:bg-slate-700/50"
          >
            <Redo2 className="w-3.5 h-3.5" />
            Redo
          </button>

          <div className="border-t border-slate-700 my-3" />

          <button
            onClick={() => setGridSnap(!gridSnap)}
            className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition ${
              gridSnap
                ? 'text-teal-300 bg-teal-600/10'
                : 'text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Grid snap
          </button>
          <div className="text-[10px] text-slate-500 pl-7">{gridSnap ? '25cm' : 'off'}</div>

          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-300 rounded-lg hover:bg-slate-700/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Center: Floor Plan Canvas */}
        <div className="flex-1 bg-slate-800 flex items-center justify-center relative">
          <div className="text-center text-slate-500">
            <div className="text-6xl mb-4">🏗️</div>
            <p className="text-sm">2D Floor Plan Canvas</p>
            <p className="text-xs text-slate-600 mt-1">(react-konva — wall segments)</p>
            {tool === 'delete' && (
              <div className="mt-4 inline-flex items-center gap-2 bg-red-900/30 text-red-300 text-xs px-4 py-2 rounded-lg border border-red-800/40">
                <Trash2 className="w-3.5 h-3.5" />
                Click a wall to delete it (load-bearing walls are protected)
              </div>
            )}
          </div>

          {/* Bottom bar: wall info */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="text-teal-300 font-medium">Tip:</span>{' '}
              {tool === 'select'
                ? 'Click a wall to select it and view properties'
                : tool === 'draw'
                ? 'Click to start drawing a wall, click again to finish'
                : 'Select a wall to delete it (rooms will merge automatically)'}
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span>🏠 Rooms: 6</span>
              <span>🧱 Walls: 14</span>
            </div>
          </div>
        </div>

        {/* Right: 3D Live Preview + Properties */}
        <div className="w-72 bg-slate-850 border-l border-slate-700 shrink-0 flex flex-col">
          {/* Properties panel (if wall selected) */}
          <div className="p-3 border-b border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Properties
            </div>
            <div className="text-xs text-slate-500 text-center py-4">
              Select a wall to see properties
            </div>
          </div>

          {/* Live 3D Preview */}
          <div className="flex-1 p-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Live 3D Preview
            </div>
            <div className="aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-3xl mb-2">🏠</div>
                <div className="text-[10px]">Preview updates</div>
                <div className="text-[10px]">in real-time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-3 flex items-center justify-between">
        <Link href={`/studio/${projectId}?useDefault=true`}>
          <Button variant="ghost" size="sm" className="text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Use Default Layout — Skip
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-2">All changes saved locally</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/studio/${projectId}?useDefault=true`)}
          >
            Skip
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-teal-600 hover:bg-teal-500"
            onClick={() => router.push(`/studio/${projectId}`)}
          >
            Apply Changes — Start Designing
          </Button>
        </div>
      </div>
    </div>
  );
}
