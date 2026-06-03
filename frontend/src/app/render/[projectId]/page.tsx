'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StudioBreadcrumb } from '@/components/layout/StudioBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, CheckCircle2, Clock, Sparkles, Camera, Download, Share2, ArrowLeft, RefreshCw } from 'lucide-react';

const MOCK_RENDERS = [
  { room: 'Living Room', roomType: 'living', style: 'Japandi', status: 'ready' as const, url: null },
  { room: 'Master Bedroom', roomType: 'mbr', style: 'Japandi', status: 'ready' as const, url: null },
  { room: 'Kitchen', roomType: 'kitchen', style: 'Vintage', status: 'ready' as const, url: null },
  { room: 'Bedroom 2', roomType: 'bed2', style: 'Scandi', status: 'pending' as const, url: null },
];

export default function RenderGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [step, setStep] = useState<'sample' | 'final'>('sample');
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [sampleGenerated, setSampleGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgressValue] = useState(0);

  const selectedRender = MOCK_RENDERS.find((r) => r.roomType === selectedRoom);

  const handleGenerateSample = () => {
    setIsGenerating(true);
    setProgressValue(0);
    const interval = setInterval(() => {
      setProgressValue((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setSampleGenerated(true);
          return 100;
        }
        return p + 10;
      });
    }, 500);
  };

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

        {/* Step 1: Sample Render */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="font-semibold text-sm">Sample Render</h2>
            <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded">~$0.04</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Room selector */}
            <div className="w-full md:w-44 shrink-0">
              <label className="text-xs text-slate-400 block mb-2">Pick a room to sample:</label>
              <div className="space-y-1">
                {MOCK_RENDERS.slice(0, 3).map((r) => (
                  <button
                    key={r.roomType}
                    onClick={() => setSelectedRoom(r.roomType)}
                    className={`w-full text-left p-2 rounded text-sm transition ${
                      selectedRoom === r.roomType
                        ? 'bg-slate-700 border border-teal-500 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {selectedRoom === r.roomType ? '●' : '○'} {r.room}
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
              {isGenerating ? (
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <Progress value={progress} className="mb-3" />
                  <div className="text-center text-xs text-slate-400">
                    AI is creating your photorealistic render...
                  </div>
                </div>
              ) : sampleGenerated ? (
                <div className="bg-slate-700/30 rounded-lg p-6 flex items-center justify-center min-h-[140px]">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🖼️</div>
                    <div className="text-xs text-teal-300 font-medium mb-1">Sample Render Ready!</div>
                    <div className="text-[10px] text-slate-400">
                      {selectedRender?.room} — {selectedRender?.style}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-teal-400 text-xs mt-2"
                      onClick={() => setSampleGenerated(false)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-700/30 rounded-lg flex items-center justify-center min-h-[140px]">
                  <div className="text-center text-slate-500">
                    <div className="text-4xl mb-2">🖼️</div>
                    <div className="text-xs">Sample render will appear here</div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      {selectedRender?.room} — {selectedRender?.style}
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
                  {selectedRender?.room} — {selectedRender?.style}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Light oak flooring, warm white walls, bamboo accents
                </div>
              </div>
              <textarea
                placeholder="Tweak prompt: 'Make it warmer, add more plants...'"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white placeholder-slate-400 h-20 resize-none"
              />
              <Button variant="secondary" size="sm" className="w-full text-xs" disabled={!sampleGenerated}>
                Regenerate (1/5)
              </Button>
            </div>
          </div>
        </Card>

        {/* Step 2: Final Render */}
        <Card className={`bg-slate-800 border-slate-700 p-6 ${!sampleGenerated ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              sampleGenerated ? 'bg-teal-600 text-white' : 'bg-slate-600 text-slate-300'
            }`}>2</span>
            <h2 className={`font-semibold text-sm ${!sampleGenerated ? 'text-slate-400' : ''}`}>Final Render</h2>
            <span className="text-[10px] bg-slate-700 text-slate-500 px-2 py-0.5 rounded">~$0.24</span>
            {!sampleGenerated && (
              <span className="text-[10px] text-amber-400 ml-2">Complete sample render first</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_RENDERS.map((r) => (
              <div key={r.roomType} className="bg-slate-700/20 p-3 rounded-lg">
                <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  {r.status === 'ready' ? (
                    <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-500" />
                  )}
                  {r.room}
                </div>
                <div className="space-y-1 text-[10px] text-slate-400">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked={r.status === 'ready'} disabled={!sampleGenerated} className="accent-teal-500" />
                    Corner View
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked={r.status === 'ready'} disabled={!sampleGenerated} className="accent-teal-500" />
                    Entrance View
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">8 renders selected</span>
            <Button
              variant="default"
              size="sm"
              disabled={!sampleGenerated}
              className="bg-teal-600 hover:bg-teal-500"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate All 8
            </Button>
          </div>
        </Card>

        {/* Gallery section if renders exist */}
        {sampleGenerated && (
          <div className="mt-8">
            <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-400" />
              Render Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MOCK_RENDERS.filter((r) => r.status === 'ready').map((r) => (
                <div key={r.roomType} className="aspect-[4/3] bg-slate-700/30 rounded-lg flex items-center justify-center hover:bg-slate-700/50 transition cursor-pointer group relative">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🖼️</div>
                    <div className="text-[10px] text-slate-400">{r.room}</div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button className="bg-slate-800/80 p-1.5 rounded text-slate-300 hover:text-white">
                      <Download className="w-3 h-3" />
                    </button>
                    <button className="bg-slate-800/80 p-1.5 rounded text-slate-300 hover:text-white">
                      <Share2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
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
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share Gallery
          </Button>
        </div>
      </div>
    </div>
  );
}
