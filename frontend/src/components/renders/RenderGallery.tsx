'use client';

export function RenderGallery() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {['Living Room', 'Master Bedroom', 'Kitchen', 'Bedroom 2'].map((room) => (
        <div
          key={room}
          className="aspect-[4/3] bg-slate-700/30 rounded-lg flex items-center justify-center hover:bg-slate-700/50 transition cursor-pointer group relative"
        >
          <div className="text-center">
            <div className="text-3xl mb-1">🖼️</div>
            <div className="text-[10px] text-slate-400">{room}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
