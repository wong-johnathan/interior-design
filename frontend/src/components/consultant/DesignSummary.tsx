'use client';

import type { DesignBrief } from '@/lib/gemini';

interface DesignSummaryProps {
  briefs: Record<string, DesignBrief>;
  activeRoom: string;
  onRoomClick: (room: string) => void;
}

const ROOM_COLORS: Record<string, string> = {
  living: 'border-l-teal-500 text-teal-300',
  kitchen: 'border-l-emerald-500 text-emerald-300',
  mbr: 'border-l-teal-500 text-teal-300',
  bed2: 'border-l-purple-500 text-purple-300',
  bath1: 'border-l-blue-500 text-blue-300',
  bath2: 'border-l-blue-500 text-blue-300',
};

const ROOM_BG_COLORS: Record<string, string> = {
  living: 'border-teal-500/30',
  kitchen: 'border-emerald-500/30',
  mbr: 'border-teal-500/30',
  bed2: 'border-purple-500/30',
  bath1: 'border-blue-500/30',
  bath2: 'border-blue-500/30',
};

const ROOM_LABELS: Record<string, string> = {
  living: 'Living Room',
  mbr: 'Master Bedroom',
  kitchen: 'Kitchen',
  bed2: 'Bedroom 2',
  bath1: 'Bathroom 1',
  bath2: 'Bathroom 2',
};

export function DesignSummary({ briefs, activeRoom, onRoomClick }: DesignSummaryProps) {
  const briefEntries = Object.entries(briefs);

  if (briefEntries.length === 0) {
    return (
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Design Brief
        </div>
        <div className="text-xs text-slate-500 italic">
          Start chatting with the AI consultant to build your design brief.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Design Brief
      </div>
      <div className="space-y-2">
        {briefEntries.map(([roomId, brief]) => (
          <button
            key={roomId}
            onClick={() => onRoomClick(roomId)}
            className={`w-full text-left bg-slate-700/30 rounded-lg p-2.5 border-l-2 transition ${
              ROOM_BG_COLORS[roomId] || 'border-slate-600'
            } ${activeRoom === roomId ? 'ring-1 ring-teal-500/40' : ''}`}
          >
            <div className={`text-xs font-medium ${ROOM_COLORS[roomId] || 'text-slate-300'}`}>
              {ROOM_LABELS[roomId] || roomId}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
              {brief.style && (
                <div>
                  <span className="text-slate-500">Style:</span> {brief.style}
                </div>
              )}
              {brief.colors && (
                <div>
                  <span className="text-slate-500">Colors:</span> {brief.colors}
                </div>
              )}
              {brief.materials && (
                <div>
                  <span className="text-slate-500">Materials:</span> {brief.materials}
                </div>
              )}
              {brief.furniture && (
                <div>
                  <span className="text-slate-500">Furniture:</span> {brief.furniture}
                </div>
              )}
              {brief.lighting && (
                <div>
                  <span className="text-slate-500">Lighting:</span> {brief.lighting}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-[10px] text-slate-500">
          <span className="text-teal-400">●</span> Active room &mdash; changes apply here
        </div>
      </div>
    </div>
  );
}
