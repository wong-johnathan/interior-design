'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Share2, Download, ArrowLeft, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useState } from 'react';

const MOCK_GALLERY = [
  { room: 'Living Room', roomType: 'living', style: 'Japandi', angles: ['Corner View', 'Entrance View'] },
  { room: 'Master Bedroom', roomType: 'mbr', style: 'Japandi', angles: ['Door View', 'Bedside View'] },
  { room: 'Kitchen', roomType: 'kitchen', style: 'Vintage', angles: ['Entrance View'] },
];

export default function SharePage() {
  const params = useParams();
  const renderId = params.renderId as string;
  const [activeIndex, setActiveIndex] = useState(0);

  const current = MOCK_GALLERY[activeIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm font-medium">{current?.room}</h1>
            <p className="text-[10px] text-slate-500">
              Verandah Kallang 2024 · {current?.style}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-400 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download HD
          </Button>
          <Button variant="default" size="sm" className="bg-teal-600 hover:bg-teal-500 text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-6">
          <span className="text-slate-400">Design Brief ✓</span>
          <span className="mx-1">›</span>
          <span className="text-slate-400">Furniture ✓</span>
          <span className="mx-1">›</span>
          <span className="text-teal-300 font-medium">Renders</span>
        </div>

        {/* Room carousel */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="text-slate-500 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            {/* Main render preview */}
            <div className="aspect-[16/9] bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 relative group">
              <div className="text-center">
                <div className="text-7xl mb-4">🖼️</div>
                <div className="text-sm text-slate-400 font-medium">{current?.room}</div>
                <div className="text-xs text-slate-500 mt-1">{current?.style} · {current?.angles[0]}</div>
              </div>

              {/* Angle selector */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {current?.angles.map((angle) => (
                  <button
                    key={angle}
                    className="bg-slate-800/80 border border-slate-600 text-xs text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-700 transition"
                  >
                    {angle}
                  </button>
                ))}
              </div>

              {/* Fullscreen */}
              <button className="absolute top-3 right-3 bg-slate-800/80 p-2 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setActiveIndex(Math.min(MOCK_GALLERY.length - 1, activeIndex + 1))}
            disabled={activeIndex === MOCK_GALLERY.length - 1}
            className="text-slate-500 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Room thumbnails */}
        <div className="grid grid-cols-3 gap-3">
          {MOCK_GALLERY.map((item, i) => (
            <button
              key={item.room}
              onClick={() => setActiveIndex(i)}
              className={`bg-slate-800 rounded-lg p-4 text-center border transition ${
                i === activeIndex ? 'border-teal-500' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-3xl mb-2">🖼️</div>
              <div className="text-xs font-medium">{item.room}</div>
              <div className="text-[10px] text-slate-500">{item.style}</div>
              <div className="text-[10px] text-slate-600 mt-1">{item.angles.length} angles</div>
            </button>
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center text-xs text-slate-600 border-t border-slate-800 pt-6">
          <p>Designed with HDB Design Studio — share this link with your family and contractors</p>
        </div>
      </div>
    </div>
  );
}
