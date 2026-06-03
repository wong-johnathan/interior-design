'use client';

interface DesignSummaryProps {
  brief: Record<string, { style: string; details: string }>;
  activeRoom: string;
  onRoomClick: (room: string) => void;
}

const ROOM_COLORS: Record<string, string> = {
  living: 'border-l-teal-500 text-teal-300',
  kitchen: 'border-l-emerald-500 text-emerald-300',
  mbr: 'border-l-teal-500 text-teal-300',
  bed2: 'border-l-purple-500 text-purple-300',
};

const ROOM_BG_COLORS: Record<string, string> = {
  living: 'border-teal-500/30',
  kitchen: 'border-emerald-500/30',
  mbr: 'border-teal-500/30',
  bed2: 'border-purple-500/30',
};

export function DesignSummary({ brief, activeRoom, onRoomClick }: DesignSummaryProps) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Design Brief
      </div>
      <div className="space-y-2">
        {Object.entries(brief).map(([roomId, data]) => (
          <button
            key={roomId}
            onClick={() => onRoomClick(roomId)}
            className={`w-full text-left bg-slate-700/30 rounded-lg p-2.5 border-l-2 transition ${
              ROOM_BG_COLORS[roomId] || 'border-slate-600'
            } ${activeRoom === roomId ? 'ring-1 ring-teal-500/40' : ''}`}
          >
            <div className={`text-xs font-medium ${ROOM_COLORS[roomId] || 'text-slate-300'}`}>
              {roomId === 'living' ? 'Living Room' : roomId === 'mbr' ? 'Master Bedroom' : roomId === 'kitchen' ? 'Kitchen' : 'Bedroom 2'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {data.style} · {data.details}
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
