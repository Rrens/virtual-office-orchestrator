'use client';

interface MinimapProps {
  onSelectRoom: (pos: [number, number, number]) => void;
}

const ROOMS = [
  { name: 'Executive', color: 'bg-indigo-900 border-indigo-600', pos: [-6, 12, -6] as [number, number, number] },
  { name: 'Product', color: 'bg-purple-900 border-purple-600', pos: [0, 12, -6] as [number, number, number] },
  { name: 'Engineering', color: 'bg-slate-900 border-sky-600', pos: [6, 12, -6] as [number, number, number] },
  { name: 'Design', color: 'bg-pink-900 border-pink-600', pos: [-6, 12, 0] as [number, number, number] },
  { name: 'Meeting', color: 'bg-slate-800 border-slate-500', pos: [0, 14, 0] as [number, number, number] },
  { name: 'Server / War', color: 'bg-red-950 border-red-600', pos: [6, 12, 0] as [number, number, number] },
  { name: 'Marketing', color: 'bg-emerald-950 border-emerald-600', pos: [-6, 12, 6] as [number, number, number] },
];

export function OfficeMinimap({ onSelectRoom }: MinimapProps) {
  return (
    <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/60 p-2.5 rounded-xl shadow-2xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
        🗺️ Minimap / Teleport
      </p>
      <div className="grid grid-cols-3 gap-1.5 w-44">
        {ROOMS.map((room) => (
          <button
            key={room.name}
            onClick={() => onSelectRoom(room.pos)}
            className={`p-1.5 rounded-lg text-[9px] font-medium border text-slate-200 hover:brightness-125 transition-all text-center leading-tight truncate ${room.color}`}
          >
            {room.name}
          </button>
        ))}
      </div>
    </div>
  );
}
