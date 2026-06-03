'use client';

export function CameraPresets() {
  return (
    <div className="flex gap-1">
      {['Corner', 'Entrance', 'Window'].map((angle) => (
        <button
          key={angle}
          className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition"
        >
          {angle}
        </button>
      ))}
    </div>
  );
}
