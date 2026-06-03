'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { StudioBreadcrumb } from '@/components/layout/StudioBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRenderStore } from '@/stores/renderStore';
import { captureViewport } from '@/lib/viewportCapture';
import type { DesignBrief } from '@/lib/gemini';
import { generateDefaultFloorPlan } from '@/lib/defaultRoomData';
import type { RoomLabel } from '@/lib/defaultRoomData';
import {
  ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Share2,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// Dynamically import ThreeDViewport (SSR-safe)
const ThreeDViewport = dynamic(
  () => import('@/components/studio/ThreeDViewport'),
  { ssr: false },
);

// ── Room config ────────────────────────────────────────────────────

interface RoomConfig {
  roomType: string;
  roomLabel: string;
  style: string;
}

const ROOMS: RoomConfig[] = [
  { roomType: 'living', roomLabel: 'Living Room', style: 'Japandi' },
  { roomType: 'mbr', roomLabel: 'Master Bedroom', style: 'Japandi' },
  { roomType: 'kitchen', roomLabel: 'Kitchen', style: 'Vintage' },
  { roomType: 'bed2', roomLabel: 'Bedroom 2', style: 'Scandi' },
];

const ROOM_ANGLES: Record<string, string[]> = {
  living: ['Corner View', 'Entrance View'],
  mbr: ['Door View', 'Bedside View'],
  kitchen: ['Entrance View', 'Counter Close-up'],
  bed2: ['Door View'],
};

// ── Design brief data (same as in studio page) ────────────────────

const DESIGN_BRIEFS: Record<string, DesignBrief> = {
  living: {
    room: 'living',
    style: 'Japandi',
    colors: 'Light oak, warm white',
    materials: 'Oak, linen, bamboo',
    furniture: 'Low-profile sofa, minimalist coffee table, open shelving',
    lighting: 'Warm ambient, task lighting',
  },
  kitchen: {
    room: 'kitchen',
    style: 'Vintage',
    colors: 'Green, cream',
    materials: 'Ceramic tiles, dark wood',
    furniture: 'Open shelving, butcher block island',
    lighting: 'Pendant, under-cabinet',
  },
  mbr: {
    room: 'mbr',
    style: 'Japandi',
    colors: 'Walnut, cream',
    materials: 'Walnut, linen, wool',
    furniture: 'Platform bed, sliding closet, nightstands',
    lighting: 'Dimmable, soft ambient',
  },
  bed2: {
    room: 'bed2',
    style: 'Scandi',
    colors: 'White, pastel accents',
    materials: 'Birch, cotton',
    furniture: 'Compact desk, single bed, shelving',
    lighting: 'Natural, task lamp',
  },
};

// ── Render result type ─────────────────────────────────────────────

interface RenderResult {
  id: string;
  roomType: string;
  roomLabel: string;
  style: string;
  imageUrl: string;
  description: string;
  angle: string;
  createdAt: string;
}

// ── Page component ─────────────────────────────────────────────────

export default function RenderGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const viewportRef = useRef<HTMLDivElement>(null);

  const store = useRenderStore();

  // Step state
  const [step, setStep] = useState<'sample' | 'final'>('sample');
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [sampleGenerated, setSampleGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [renders, setRenders] = useState<RenderResult[]>([]);
  const [currentSample, setCurrentSample] = useState<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [selectedAngles] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const [room, angles] of Object.entries(ROOM_ANGLES)) {
      init[room] = [...angles];
    }
    return init;
  });
  const [renderCount, setRenderCount] = useState(0);

  const floorPlan = useMemoFn(generateDefaultFloorPlan);

  const currentRoom = ROOMS.find((r) => r.roomType === selectedRoom);
  const currentBrief = DESIGN_BRIEFS[selectedRoom];

  // ── Capture canvas and generate render ──

  const generateRender = useCallback(
    async (roomType: string, angle: string, isSample: boolean) => {
      const canvas = viewportRef.current?.querySelector('canvas');
      if (!canvas) {
        throw new Error('Viewport canvas not found. Please make sure the 3D view is loaded.');
      }

      setProgressMessage(`Capturing viewport for ${angle}...`);
      const imageDataUrl = await captureViewport(canvas);

      setProgressMessage(`Analyzing design for ${roomType}...`);

      const brief = DESIGN_BRIEFS[roomType];
      const roomLabels: RoomLabel[] = floorPlan.roomLabels;

      // Build the prompt with the angle context
      const promptOverride = isSample
        ? undefined
        : `Render the ${brief.style} ${ROOMS.find((r) => r.roomType === roomType)?.roomLabel || roomType} from the **${angle}** perspective. ${tweakPrompt ? `Additional user request: ${tweakPrompt}` : ''}`;

      setProgressMessage(`Calling AI for ${angle}...`);

      const response = await fetch('/api/render/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          room: roomType,
          style: brief.style,
          brief,
          roomLabels,
          promptOverride,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Render API error (${response.status}): ${errBody}`);
      }

      const data: {
        description: string;
        imageUrl: string;
        room: string;
        roomLabel: string;
        style: string;
        isPlaceholder?: boolean;
      } = await response.json();

      setProgressMessage(`Render complete for ${data.roomLabel}!`);

      return {
        id: `${roomType}-${angle}-${Date.now()}`,
        roomType,
        roomLabel: data.roomLabel,
        style: data.style,
        imageUrl: data.imageUrl,
        description: data.description,
        angle,
        createdAt: new Date().toISOString(),
      };
    },
    [floorPlan, tweakPrompt],
  );

  // ── Handle Generate Sample ──

  const handleGenerateSample = useCallback(async () => {
    setIsGenerating(true);
    setProgressValue(0);
    setError(null);
    setCurrentSample(null);

    try {
      // Sample generates from the "Corner View" angle of the selected room
      const angle = ROOM_ANGLES[selectedRoom]?.[0] || 'Default View';

      // Simulate progress for UX feedback (real progress comes from steps)
      const progressInterval = setInterval(() => {
        setProgressValue((p) => Math.min(p + 8, 90));
      }, 400);

      const result = await generateRender(selectedRoom, angle, true);

      clearInterval(progressInterval);
      setProgressValue(100);
      setCurrentSample(result);
      setSampleGenerated(true);
      setStep('final');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sample render');
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  }, [selectedRoom, generateRender]);

  // ── Handle Generate All ──

  const handleGenerateAll = useCallback(async () => {
    setIsGenerating(true);
    setProgressValue(0);
    setError(null);

    const allJobs: { roomType: string; angle: string; roomLabel: string }[] = [];

    for (const room of ROOMS) {
      const angles = selectedAngles[room.roomType] || ROOM_ANGLES[room.roomType] || [];
      for (const angle of angles) {
        allJobs.push({ roomType: room.roomType, angle, roomLabel: room.roomLabel });
      }
    }

    const totalJobs = allJobs.length;
    const newRenders: RenderResult[] = [];
    let completed = 0;

    try {
      for (const job of allJobs) {
        const result = await generateRender(job.roomType, job.angle, false);
        newRenders.push(result);
        completed++;
        setProgressValue(Math.round((completed / totalJobs) * 100));
        setProgressMessage(`${completed} of ${totalJobs} renders complete`);
      }

      setRenders((prev) => [...prev, ...newRenders]);
      setRenderCount((c) => c + totalJobs);
      setProgressValue(100);
      setProgressMessage(`All ${totalJobs} renders generated!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate renders');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedAngles, generateRender]);

  // ── Handle Regenerate Room ──

  const handleRegenerateRoom = useCallback(
    async (roomType: string, angle: string) => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateRender(roomType, angle, false);
        setRenders((prev) => {
          const filtered = prev.filter(
            (r) => !(r.roomType === roomType && r.angle === angle),
          );
          return [...filtered, result];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to regenerate ${roomType}`);
      } finally {
        setIsGenerating(false);
      }
    },
    [generateRender],
  );

  // ── Handle Download ──

  const handleDownload = useCallback((render: RenderResult) => {
    const link = document.createElement('a');
    link.href = render.imageUrl;
    link.download = `${render.roomLabel}-${render.angle}-${render.style}.png`;
    link.click();
  }, []);

  // ── Group renders by room for the gallery ──

  const rendersByRoom = renders.reduce(
    (acc, r) => {
      if (!acc[r.roomType]) acc[r.roomType] = [];
      acc[r.roomType].push(r);
      return acc;
    },
    {} as Record<string, RenderResult[]>,
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <StudioBreadcrumb
        projectName="Verandah Kallang 2024"
        projectInfo="4-Room · Model A"
        items={[
          { label: 'Design Brief', href: `/studio/${projectId}` },
          { label: 'Furniture', href: `/studio/${projectId}?tab=furniture` },
          { label: 'Renders', isActive: true },
        ]}
      />

      <div className="max-w-4xl mx-auto w-full px-6 py-8 overflow-y-auto">
        <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-teal-400" />
          Generate Renders
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Step 1: Create a sample to check the AI understands your style.
        </p>

        {/* ── 3D Viewport (hidden capture source) ── */}
        <div ref={viewportRef} className="absolute opacity-0 pointer-events-none" style={{ width: 1, height: 1, overflow: 'hidden' }}>
          <ThreeDViewport
            wallSegments={floorPlan.walls}
            roomLabels={floorPlan.roomLabels}
            activeRoom={selectedRoom}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="bg-red-900/30 border-red-700 p-4 mb-6">
            <div className="flex items-center gap-2 text-red-300 text-sm">
              <span className="font-medium">Error:</span>
              <span className="text-xs">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-300 mt-2 text-xs"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </Card>
        )}

        {/* ── Step 1: Sample Render ── */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h2 className="font-semibold text-sm">Sample Render</h2>
            <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
              ~$0.04
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Room selector */}
            <div className="w-full md:w-44 shrink-0">
              <label className="text-xs text-slate-400 block mb-2">
                Pick a room to sample:
              </label>
              <div className="space-y-1">
                {ROOMS.slice(0, 3).map((r) => (
                  <button
                    key={r.roomType}
                    onClick={() => setSelectedRoom(r.roomType)}
                    className={`w-full text-left p-2 rounded text-sm transition ${
                      selectedRoom === r.roomType
                        ? 'bg-slate-700 border border-teal-500 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {selectedRoom === r.roomType ? '●' : '○'} {r.roomLabel}
                  </button>
                ))}
              </div>

              <Button
                className="mt-3 w-full bg-teal-600 hover:bg-teal-500 text-xs"
                size="sm"
                onClick={handleGenerateSample}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 animate-spin" />
                    Rendering...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Generate Sample
                  </span>
                )}
              </Button>
            </div>

            {/* Preview + Progress */}
            <div className="flex-1">
              {isGenerating && !currentSample ? (
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <Progress value={progressValue} className="mb-3" />
                  <div className="text-center text-xs text-slate-400">
                    {progressMessage || 'AI is creating your photorealistic render...'}
                  </div>
                </div>
              ) : currentSample ? (
                <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                  <div className="aspect-[4/3] relative">
                    <img
                      src={currentSample.imageUrl}
                      alt={`${currentSample.roomLabel} sample render`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-teal-300 font-medium mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Sample Render Ready!
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      {currentSample.roomLabel} — {currentSample.style}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed max-h-20 overflow-y-auto line-clamp-3">
                      {currentSample.description.slice(0, 200)}...
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-teal-400 text-xs mt-2"
                      onClick={handleGenerateSample}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-700/30 rounded-lg flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-slate-500">
                    <div className="text-4xl mb-2">🖼️</div>
                    <div className="text-xs">Sample render will appear here</div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      {currentRoom?.roomLabel} — {currentRoom?.style}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Review panel */}
            <div className="w-full md:w-52 space-y-3">
              <div className="text-xs text-slate-400 font-medium">Review</div>
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <div className="text-xs font-medium text-teal-300">
                  {currentRoom?.roomLabel} — {currentRoom?.style}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {currentBrief?.colors}, {currentBrief?.materials}
                </div>
              </div>
              <textarea
                placeholder="Tweak prompt: 'Make it warmer, add more plants...'"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white placeholder-slate-400 h-20 resize-none"
                value={tweakPrompt}
                onChange={(e) => setTweakPrompt(e.target.value)}
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                disabled={!sampleGenerated || isGenerating}
                onClick={handleGenerateSample}
              >
                Regenerate with tweaks
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Step 2: Final Render ── */}
        <Card
          className={`bg-slate-800 border-slate-700 p-6 ${
            !sampleGenerated ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                sampleGenerated
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-600 text-slate-300'
              }`}
            >
              2
            </span>
            <h2
              className={`font-semibold text-sm ${
                !sampleGenerated ? 'text-slate-400' : ''
              }`}
            >
              Final Render
            </h2>
            <span className="text-[10px] bg-slate-700 text-slate-500 px-2 py-0.5 rounded">
              ~$0.24
            </span>
            {!sampleGenerated && (
              <span className="text-[10px] text-amber-400 ml-2">
                Complete sample render first
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROOMS.map((r) => {
              const angles = ROOM_ANGLES[r.roomType] || [];
              const hasRender = renders.some((rend) => rend.roomType === r.roomType);
              return (
                <div key={r.roomType} className="bg-slate-700/20 p-3 rounded-lg">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
                    {hasRender ? (
                      <CheckCircle2 className="w-3 h-3 text-teal-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-500" />
                    )}
                    {r.roomLabel}
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-400">
                    {angles.map((angle) => (
                      <label
                        key={angle}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={selectedAngles[r.roomType]?.includes(angle)}
                          disabled={!sampleGenerated || isGenerating}
                          className="accent-teal-500"
                          onChange={() => {
                            // Toggle angle in local state
                            const current = selectedAngles[r.roomType] || [];
                            if (current.includes(angle)) {
                              selectedAngles[r.roomType] = current.filter(
                                (a) => a !== angle,
                              );
                            } else {
                              selectedAngles[r.roomType] = [...current, angle];
                            }
                          }}
                        />
                        {angle}
                      </label>
                    ))}
                  </div>
                  {hasRender && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-teal-400 text-[10px] mt-2 p-0 h-auto"
                      onClick={() => {
                        const existing = renders.find(
                          (rend) => rend.roomType === r.roomType,
                        );
                        if (existing) {
                          handleRegenerateRoom(
                            r.roomType,
                            existing.angle,
                          );
                        }
                      }}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-2.5 h-2.5 mr-1" />
                      Regenerate
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {renders.length} render{renders.length !== 1 ? 's' : ''} generated
            </span>
            <Button
              variant="default"
              size="sm"
              disabled={!sampleGenerated || isGenerating}
              className="bg-teal-600 hover:bg-teal-500"
              onClick={handleGenerateAll}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generate All
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* ── Progress overlay during batch generation ── */}
        {isGenerating && renders.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              <span className="text-xs text-slate-300">
                {progressMessage || 'Generating renders...'}
              </span>
            </div>
            <Progress value={progressValue} className="h-1.5" />
          </Card>
        )}

        {/* ── Gallery section ── */}
        {renders.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-400" />
              Render Gallery
            </h2>

            {/* Group by room */}
            {ROOMS.map((room) => {
              const roomRenders = rendersByRoom[room.roomType];
              if (!roomRenders || roomRenders.length === 0) return null;

              return (
                <div key={room.roomType}>
                  <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-teal-500" />
                    {room.roomLabel}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {roomRenders.map((render) => (
                      <div
                        key={render.id}
                        className="aspect-[4/3] bg-slate-700/30 rounded-lg overflow-hidden hover:bg-slate-700/50 transition group relative"
                      >
                        <img
                          src={render.imageUrl}
                          alt={render.roomLabel}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                          <div className="text-[10px] font-medium text-white">
                            {render.roomLabel}
                          </div>
                          <div className="text-[9px] text-slate-300">
                            {render.style} · {render.angle}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            className="bg-slate-800/80 p-1.5 rounded text-slate-300 hover:text-white"
                            onClick={() => handleDownload(render)}
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            className="bg-slate-800/80 p-1.5 rounded text-slate-300 hover:text-white"
                            onClick={() =>
                              handleRegenerateRoom(render.roomType, render.angle)
                            }
                            disabled={isGenerating}
                            title="Regenerate"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Room/angle label on image */}
                        <div className="absolute bottom-2 left-2 text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition">
                          {render.angle}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/studio/${projectId}`)}
            className="text-slate-400"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Studio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/share/demo-${projectId}`)}
            disabled={renders.length === 0}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share Gallery
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Simple useMemo replacement hook ──

function useMemoFn<T>(fn: () => T): T {
  const ref = useRef<{ value: T }>(undefined);
  if (!ref.current) {
    ref.current = { value: fn() };
  }
  return ref.current.value;
}
