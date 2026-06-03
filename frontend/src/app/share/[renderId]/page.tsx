'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BeforeAfterSlider } from '@/components/renders/BeforeAfterSlider';

// ── Mock gallery data ──────────────────────────────────────────────

interface GalleryRender {
  id: string;
  roomType: string;
  roomLabel: string;
  style: string;
  beforeUrl?: string;
  afterUrl?: string;
  angle: string;
  createdAt: string;
}

const MOCK_GALLERY: GalleryRender[] = [
  {
    id: 'living-default',
    roomType: 'living',
    roomLabel: 'Living Room',
    style: 'Japandi',
    beforeUrl: undefined,
    afterUrl: undefined,
    angle: 'Corner View',
    createdAt: '2026-06-03T10:00:00Z',
  },
  {
    id: 'mbr-default',
    roomType: 'mbr',
    roomLabel: 'Master Bedroom',
    style: 'Japandi',
    beforeUrl: undefined,
    afterUrl: undefined,
    angle: 'Door View',
    createdAt: '2026-06-03T10:05:00Z',
  },
  {
    id: 'kitchen-default',
    roomType: 'kitchen',
    roomLabel: 'Kitchen',
    style: 'Vintage',
    beforeUrl: undefined,
    afterUrl: undefined,
    angle: 'Entrance View',
    createdAt: '2026-06-03T10:10:00Z',
  },
];

// ── Room angles ────────────────────────────────────────────────────

const ROOM_ANGLES: Record<string, string[]> = {
  living: ['Corner View', 'Entrance View', 'Window View'],
  mbr: ['Door View', 'Bedside View', 'Window View'],
  kitchen: ['Entrance View', 'Counter Close-up', 'Sink View'],
};

// ── Page ───────────────────────────────────────────────────────────

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const renderId = params.renderId as string;

  const [activeRoom, setActiveRoom] = useState('living');
  const [showBeforeAfter, setShowBeforeAfter] = useState(true);
  const [copied, setCopied] = useState(false);

  // Derive rooms from gallery data
  const rooms = useMemo(
    () =>
      MOCK_GALLERY.map((r) => ({
        id: r.roomType,
        label: r.roomLabel,
        style: r.style,
        beforeUrl: r.beforeUrl,
        afterUrl: r.afterUrl,
      })),
    [],
  );

  const currentAngles = ROOM_ANGLES[activeRoom] || ROOM_ANGLES['living'];

  // ── Handlers ──

  const handleDownload = useCallback(() => {
    // In production, this would trigger download of the current render
    const link = document.createElement('a');
    link.href = '#'; // Placeholder — real URL from gallery data
    link.download = `${activeRoom}-render.png`;
    link.click();
  }, [activeRoom]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleRegenerate = useCallback(() => {
    // In production, this would trigger AI regeneration
    console.log('Regenerate render for:', activeRoom);
  }, [activeRoom]);

  const handleCopyLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const toggleView = useCallback(() => {
    setShowBeforeAfter((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold">Render Preview</h1>
              <p className="text-[10px] text-slate-500">
                Verandah Kallang 2024 · {renderId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Before/After toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleView}
              className="text-xs text-slate-400 hover:text-white gap-1.5"
              title="Toggle before/after comparison"
            >
              {showBeforeAfter ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Side-by-side
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Comparison
                </>
              )}
            </Button>

            {/* Copy share link */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700/50 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-6 py-6 space-y-6">
          {/* ── Before/After Slider (primary view) ── */}
          {showBeforeAfter ? (
            <BeforeAfterSlider
              rooms={rooms}
              activeRoom={activeRoom}
              angles={currentAngles}
              activeAngle={currentAngles[0]}
              onRoomChange={setActiveRoom}
              onDownload={handleDownload}
              onShare={handleShare}
              onRegenerate={handleRegenerate}
            />
          ) : (
            /* ── Side-by-Side Grid (alternative view) ── */
            <div className="space-y-6">
              {/* Room tabs */}
              <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 self-start">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room.id)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                      activeRoom === room.id
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {room.label}
                  </button>
                ))}
              </div>

              {/* Two-column before/after grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <Card className="bg-slate-800 border-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Before
                    </span>
                    <span className="text-[9px] text-slate-500">Empty Shell</span>
                  </div>
                  <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
                    <div className="text-center">
                      <div className="text-5xl mb-2 opacity-60">🏗️</div>
                      <div className="text-xs text-slate-400">
                        Unfurnished
                      </div>
                    </div>
                  </div>
                </Card>

                {/* After */}
                <Card className="bg-slate-800 border-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                    <span className="text-[10px] font-medium text-teal-400 uppercase tracking-wider">
                      After
                    </span>
                    <span className="text-[9px] text-slate-500">AI-Staged</span>
                  </div>
                  <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-teal-900/60 via-indigo-800/40 to-slate-800">
                    <div className="text-center">
                      <div className="text-5xl mb-2 opacity-80">✨</div>
                      <div className="text-xs text-teal-300">
                        Styled
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Action buttons for side-by-side */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/50"
                >
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShare}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/50"
                >
                  Share
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRegenerate}
                  className="bg-teal-600 hover:bg-teal-500 text-xs"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* ── Gallery Carousel (all rooms) ── */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-medium text-slate-400 mb-3">
              All Renders
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MOCK_GALLERY.map((render) => (
                <button
                  key={render.id}
                  onClick={() => setActiveRoom(render.roomType)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border transition ${
                    activeRoom === render.roomType
                      ? 'border-teal-500 ring-1 ring-teal-500/40'
                      : 'border-slate-700/30 hover:border-slate-600'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center bg-slate-800/80">
                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {activeRoom === render.roomType ? '✨' : '🖼️'}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {render.roomLabel}
                      </div>
                      <div className="text-[8px] text-slate-500 mt-0.5">
                        {render.angle}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
