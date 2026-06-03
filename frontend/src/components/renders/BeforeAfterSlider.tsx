'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Share2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────

interface RoomConfig {
  id: string;
  label: string;
  style: string;
  beforeUrl?: string;
  afterUrl?: string;
}

interface BeforeAfterSliderProps {
  rooms?: RoomConfig[];
  /** Current active room ID */
  activeRoom?: string;
  /** Currently selected angle label */
  activeAngle?: string;
  /** Available angles for the current room */
  angles?: string[];
  /** Called when user selects a different room tab */
  onRoomChange?: (roomId: string) => void;
  /** Called when user selects an angle */
  onAngleChange?: (angle: string) => void;
  /** Called on Download action */
  onDownload?: () => void;
  /** Called on Share action */
  onShare?: () => void;
  /** Called on Regenerate action */
  onRegenerate?: () => void;
}

// ── Component ──────────────────────────────────────────────────────

export function BeforeAfterSlider({
  rooms = [
    { id: 'living', label: 'Living Room', style: 'Japandi' },
    { id: 'mbr', label: 'MBR', style: 'Japandi' },
    { id: 'kitchen', label: 'Kitchen', style: 'Vintage' },
  ],
  activeRoom: controlledRoom,
  activeAngle,
  angles: controlledAngles,
  onRoomChange,
  onAngleChange,
  onDownload,
  onShare,
  onRegenerate,
}: BeforeAfterSliderProps) {
  // ── Internal state when uncontrolled ──
  const [internalRoom, setInternalRoom] = useState(rooms[0]?.id || 'living');
  const [internalAngle, setInternalAngle] = useState('');

  const resolvedRoom = controlledRoom ?? internalRoom;
  const resolvedAngles = controlledAngles ?? ['Corner View', 'Entrance View'];
  const resolvedAngle =
    activeAngle ?? internalAngle ?? resolvedAngles[0] ?? '';

  // Sync internal angle when room or angles change
  useEffect(() => {
    if (resolvedAngles.length > 0 && !resolvedAngles.includes(resolvedAngle)) {
      setInternalAngle(resolvedAngles[0]);
    }
  }, [resolvedRoom, resolvedAngles, resolvedAngle]);

  // ── Slider state ──
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(0, Math.min(100, pct)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !containerRef.current) return;

    const onTouchMove = (ev: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touchPt = ev.touches[0];
      if (!touchPt) return;
      const pct = ((touchPt.clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(0, Math.min(100, pct)));
    };

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }, []);

  // ── Room change handler ──
  const handleRoomClick = useCallback(
    (roomId: string) => {
      setInternalRoom(roomId);
      setSliderPos(50);
      onRoomChange?.(roomId);
    },
    [onRoomChange],
  );

  // ── Angle change handler ──
  const handleAngleClick = useCallback(
    (angle: string) => {
      setInternalAngle(angle);
      onAngleChange?.(angle);
    },
    [onAngleChange],
  );

  const currentRoom = rooms.find((r) => r.id === resolvedRoom);
  const roomLabel = currentRoom?.label ?? resolvedRoom;
  const roomStyle = currentRoom?.style ?? '';
  const beforeUrl = currentRoom?.beforeUrl;
  const afterUrl = currentRoom?.afterUrl;

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* ── Room Tabs ── */}
      <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 self-start">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => handleRoomClick(room.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
              resolvedRoom === room.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            {room.label}
          </button>
        ))}
      </div>

      {/* ── Angle Selector ── */}
      <div className="flex flex-wrap gap-1.5">
        {resolvedAngles.map((angle) => (
          <button
            key={angle}
            onClick={() => handleAngleClick(angle)}
            className={`px-3 py-1 rounded text-[11px] font-medium transition ${
              resolvedAngle === angle
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
            }`}
          >
            {angle}
          </button>
        ))}
      </div>

      {/* ── Slider Container ── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-slate-800 select-none border border-slate-700/50"
        style={{ aspectRatio: '16/9' }}
        onTouchStart={handleTouchStart}
      >
        {/* ── BEFORE (Empty Shell) — clipped by slider ── */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {beforeUrl ? (
            <img
              src={beforeUrl}
              alt="Empty room shell"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
              <div className="text-6xl mb-3 opacity-60">🏗️</div>
              <div className="text-sm font-medium text-slate-400">
                Empty Shell
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {roomLabel} — Unfurnished
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 opacity-30">
                {['⬜', '⬜', '⬜', '⬜', '⬜', '⬜'].map((sq, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-slate-600/30 rounded border border-slate-600/20 flex items-center justify-center text-xs"
                  >
                    {sq}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before label */}
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
            Before
          </div>
        </div>

        {/* ── AFTER (Styled) ── */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          {afterUrl ? (
            <img
              src={afterUrl}
              alt="Styled room"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-900/60 via-indigo-800/40 to-slate-800">
              <div className="text-6xl mb-3 opacity-80">✨</div>
              <div className="text-sm font-medium text-teal-300">
                AI-Staged
              </div>
              <div className="text-[10px] text-teal-400/60 mt-1">
                {roomLabel} — {roomStyle || 'Styled'}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 opacity-40">
                {['🪴', '🛋️', '💡', '🖼️', '📚', '🕯️'].map((item, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-white/5 rounded border border-white/10 flex items-center justify-center text-xs"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* After label */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
            After
          </div>
        </div>

        {/* ── Slider Divider Line + Handle ── */}
        <div
          className="absolute top-0 bottom-0 z-20 cursor-ew-resize"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
        >
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />

          {/* Drag handle circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-white hover:scale-110 transition-transform">
            <div className="flex gap-0.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#334155"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 3L1 7L4 11" />
                <path d="M10 3L13 7L10 11" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Room/Style info bar ── */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300">{roomLabel}</span>
          <span className="text-slate-600">·</span>
          <span>{roomStyle}</span>
          <span className="text-slate-600">·</span>
          <span>{resolvedAngle}</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Drag slider to compare
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700/50"
          onClick={onDownload}
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700/50"
          onClick={onShare}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-teal-600 hover:bg-teal-500 text-xs flex items-center gap-1.5"
          onClick={onRegenerate}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
