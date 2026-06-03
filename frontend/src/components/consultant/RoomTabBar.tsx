'use client';

interface RoomTabBarProps {
  activeRoom: string;
  onRoomChange: (room: string) => void;
}

const ROOMS = [
  { id: 'living', label: 'Living Room', short: 'Living' },
  { id: 'mbr', label: 'Master Bedroom', short: 'MBR' },
  { id: 'kitchen', label: 'Kitchen', short: 'Kitchen' },
  { id: 'bed2', label: 'Bedroom 2', short: 'Bed 2' },
  { id: 'bath1', label: 'Bathroom 1', short: 'Bath 1' },
  { id: 'bath2', label: 'Bathroom 2', short: 'Bath 2' },
];

export function RoomTabBar({ activeRoom, onRoomChange }: RoomTabBarProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {ROOMS.map((room) => (
        <button
          key={room.id}
          onClick={() => onRoomChange(room.id)}
          className={`px-3 py-1 text-xs rounded-full transition ${
            activeRoom === room.id
              ? 'bg-teal-600/20 text-teal-300 font-medium'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          {room.short}
        </button>
      ))}
    </div>
  );
}
