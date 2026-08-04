import React from 'react';
import { Users, Lock, Globe, Play, Crown, Sparkles } from 'lucide-react';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  return (
    <div className="group relative bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col">
      
      {/* Poster Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <img
          src={room.media.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-extrabold text-white uppercase tracking-wider">
            {room.category}
          </span>

          <div className="flex items-center gap-1.5">
            {room.passwordRequired ? (
              <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </span>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Public
              </span>
            )}
          </div>
        </div>

        {/* Hover Quick Play overlay button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <button
            onClick={() => onJoin(room.id)}
            className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 scale-90 group-hover:scale-100 transition-transform cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
          </button>
        </div>

        {/* Media Title Badge at bottom of poster */}
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-[11px] font-semibold text-indigo-300 truncate flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {room.media.title}
          </p>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {room.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {room.description}
          </p>
        </div>

        {/* Host Info & Participant Avatars */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={room.hostAvatar}
                alt={room.hostName}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
              <Crown className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 fill-amber-400" />
            </div>
            <div className="text-[11px]">
              <p className="text-zinc-300 font-bold leading-none">{room.hostName}</p>
              <p className="text-zinc-500 text-[9px]">Host</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{room.participants.length}/{room.maxParticipants}</span>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={() => onJoin(room.id)}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 text-zinc-200 hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Join Watch Party</span>
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>

      </div>
    </div>
  );
};
