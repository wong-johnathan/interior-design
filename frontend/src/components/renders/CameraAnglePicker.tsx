'use client';

interface CameraAnglePickerProps {
  roomType: string;
  selectedAngles: string[];
  onSelect: (angle: string) => void;
}

const PRESETS: Record<string, string[]> = {
  living: ['Corner View', 'Entrance View', 'Window-side'],
  mbr: ['Door View', 'Bedside View'],
  kitchen: ['Entrance View', 'Counter Close-up'],
  bedroom: ['Door View'],
};

export function CameraAnglePicker({ roomType, selectedAngles, onSelect }: CameraAnglePickerProps) {
  const angles = PRESETS[roomType] || ['Default'];

  return (
    <div className="space-y-1.5">
      {angles.map((angle) => (
        <button
          key={angle}
          onClick={() => onSelect(angle)}
          className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded transition ${
            selectedAngles.includes(angle)
              ? 'bg-teal-600/20 text-teal-300 border border-teal-600/40'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
          }`}
        >
          📷 {angle}
        </button>
      ))}
    </div>
  );
}
