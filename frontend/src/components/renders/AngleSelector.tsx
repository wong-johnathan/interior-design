'use client';

interface AngleSelectorProps {
  angles: string[];
  selected: string[];
  onToggle: (angle: string) => void;
}

export function AngleSelector({ angles, selected, onToggle }: AngleSelectorProps) {
  return (
    <div className="space-y-1">
      {angles.map((angle) => (
        <label
          key={angle}
          className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.includes(angle)}
            onChange={() => onToggle(angle)}
            className="accent-teal-500"
          />
          {angle}
        </label>
      ))}
    </div>
  );
}
