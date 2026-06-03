'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { StudioBreadcrumb } from '@/components/layout/StudioBreadcrumb';
import { ChatPanel } from '@/components/consultant/ChatPanel';
import { DesignSummary } from '@/components/consultant/DesignSummary';
import { RoomTabBar } from '@/components/consultant/RoomTabBar';
import { Button } from '@/components/ui/button';
import ExportDialog from '@/components/export/ExportDialog';
import { generateDefaultFloorPlan } from '@/lib/defaultRoomData';
import { captureViewport } from '@/lib/viewportCapture';
import {
  Palette,
  Download,
  Image as ImageIcon,
  Grid3X3,
  Sofa,
  MessageSquare,
  X,
  Sparkles,
  Clock,
} from 'lucide-react';

// Dynamically import ThreeDViewport (SSR-safe for Three.js)
const ThreeDViewport = dynamic(
  () => import('@/components/studio/ThreeDViewport'),
  { ssr: false },
);

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState('living');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  const floorPlan = useMemo(() => generateDefaultFloorPlan(), []);

  const rooms = [
    { id: 'living', label: 'Living Room' },
    { id: 'mbr', label: 'MBR' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bed2', label: 'Bed 2' },
  ];

  const designBriefData = {
    'living': { room: 'living', style: 'Japandi', colors: 'Light oak, warm white', materials: 'Oak, linen, bamboo', furniture: 'Low-profile, minimalist', lighting: 'Warm ambient, task' },
    'kitchen': { room: 'kitchen', style: 'Vintage', colors: 'Green, cream', materials: 'Ceramic tiles, dark wood', furniture: 'Open shelving, butcher block', lighting: 'Pendant, under-cabinet' },
    'mbr': { room: 'mbr', style: 'Japandi', colors: 'Walnut, cream', materials: 'Walnut, linen, wool', furniture: 'Platform bed, sliding closet', lighting: 'Dimmable, soft' },
    'bed2': { room: 'bed2', style: 'Scandi', colors: 'White, pastel accents', materials: 'Birch, cotton', furniture: 'Compact desk, bed', lighting: 'Natural, task lamp' },
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Breadcrumb */}
      <StudioBreadcrumb
        projectName="Verandah Kallang 2024"
        projectInfo="4-Room · Model A"
        items={[
          { label: 'Design Brief', href: `/studio/${projectId}`, isActive: true },
          { label: 'Furniture', href: `/studio/${projectId}?tab=furniture` },
          { label: 'Renders', href: `/render/${projectId}` },
        ]}
      />

      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Chat (desktop) */}
        <div
          className={`${
            isChatOpen ? 'w-80' : 'w-0'
          } bg-slate-850 border-r border-slate-700 flex flex-col shrink-0 transition-all duration-300 overflow-hidden hidden md:flex`}
        >
          <ChatPanel
            activeRoom={activeRoom}
            onRoomChange={setActiveRoom}
            onClose={() => setIsChatOpen(false)}
          />
        </div>

        {/* Center: 3D Viewport */}
        <div ref={viewportContainerRef} className="flex-1 bg-slate-800 relative">
          <ThreeDViewport
            wallSegments={floorPlan.walls}
            roomLabels={floorPlan.roomLabels}
            activeRoom={activeRoom}
          />

          {/* Floating Action Buttons */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-xs flex items-center gap-1"
              onClick={() => router.push(`/studio/${projectId}?tab=furniture`)}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Furnish
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-xs flex items-center gap-1"
              onClick={() => setIsExportOpen(true)}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-teal-600 hover:bg-teal-500 text-xs flex items-center gap-1"
              onClick={async () => {
                setIsCapturing(true);
                try {
                  const canvas = viewportContainerRef.current?.querySelector('canvas');
                  if (canvas) {
                    const dataUrl = await captureViewport(canvas);
                    sessionStorage.setItem(`viewport-capture-${projectId}`, dataUrl);
                  }
                } catch (e) {
                  console.warn('Viewport capture failed:', e);
                } finally {
                  setIsCapturing(false);
                }
                router.push(`/render/${projectId}`);
              }}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Capturing...
                </span>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  Generate Sample
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-xs flex items-center gap-1"
            >
              <Sofa className="w-3.5 h-3.5" />
              Catalog
            </Button>
          </div>
        </div>

        {/* Right Panel: Design Summary (desktop) */}
        <div className="w-64 bg-slate-850 border-l border-slate-700 p-3 shrink-0 overflow-y-auto hidden md:block">
          <DesignSummary
            briefs={designBriefData}
            activeRoom={activeRoom}
            onRoomClick={setActiveRoom}
          />
        </div>
      </div>

      {/* Mobile: Chat toggle button */}
      {!isMobileChatOpen && (
        <button
          onClick={() => setIsMobileChatOpen(true)}
          className="md:hidden fixed bottom-20 right-4 bg-teal-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-40"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Mobile: Chat bottom sheet */}
      {isMobileChatOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setIsMobileChatOpen(false)} />
          <div className="bg-slate-800 rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-sm font-medium text-teal-400">Design Consultant</span>
              <button onClick={() => setIsMobileChatOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[60vh]">
              <ChatPanel
                activeRoom={activeRoom}
                onRoomChange={setActiveRoom}
                onClose={() => setIsMobileChatOpen(false)}
                isMobile
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
    </div>
  );
}
