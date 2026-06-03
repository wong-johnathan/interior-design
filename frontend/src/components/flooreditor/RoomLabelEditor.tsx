'use client';

interface RoomLabelEditorProps {
  rooms: string[];
  onLabelChange: (index: number, newLabel: string) => void;
  onDone: () => void;
}

export function RoomLabelEditor({ rooms, onLabelChange, onDone }: RoomLabelEditorProps) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
      <div className="text-xs font-semibold text-slate-300 mb-2">Name the new rooms</div>
      <div className="space-y-2">
        {rooms.map((room, i) => (
          <input
            key={i}
            type="text"
            defaultValue={room}
            onChange={(e) => onLabelChange(i, e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500"
            placeholder={`Room ${i + 1}`}
          />
        ))}
      </div>
      <button
        onClick={onDone}
        className="mt-2 w-full bg-teal-600 hover:bg-teal-500 text-xs text-white py-1.5 rounded transition"
      >
        Done
      </button>
    </div>
  );
}
