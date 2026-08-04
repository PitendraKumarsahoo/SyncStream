import React, { useState } from 'react';
import { Search, Sparkles, Tv, Users, Activity, Plus, ShieldCheck, Flame, Filter } from 'lucide-react';
import { Room } from '../types';
import { RoomCard } from './RoomCard';
import { CATEGORIES } from '../data/presetMedia';

interface DashboardViewProps {
  rooms: Room[];
  onJoinRoom: (room: Room) => void;
  onCreateRoom: () => void;
  latency: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rooms,
  onJoinRoom,
  onCreateRoom,
  latency
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter(room => {
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalWatchers = rooms.reduce((acc, r) => acc + r.participants.length, 0);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/80 border border-zinc-800/80 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Latency Synchronized Watch Party Platform</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Watch Movies & Videos <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              In Perfect Sync Together.
            </span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base mt-3 leading-relaxed">
            Host live cinema rooms, talk via WebRTC voice chat, throw real-time floating reactions, and stream videos with precise frame-accurate synchronization.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onCreateRoom}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-xl shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Host Watch Party</span>
            </button>

            {rooms.length > 0 && (
              <button
                onClick={() => onJoinRoom(rooms[0])}
                className="px-6 py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Join Featured Party</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-8 pt-6 border-t border-zinc-800/60 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800/60">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Active Parties</span>
            </div>
            <p className="text-xl font-black text-white mt-1">{rooms.length}</p>
          </div>

          <div className="bg-zinc-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800/60">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Watchers Online</span>
            </div>
            <p className="text-xl font-black text-white mt-1">{totalWatchers}</p>
          </div>

          <div className="bg-zinc-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800/60">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Sync Precision</span>
            </div>
            <p className="text-xl font-black text-emerald-400 mt-1">&lt; 0.02s</p>
          </div>

          <div className="bg-zinc-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800/60">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Network Ping</span>
            </div>
            <p className="text-xl font-black text-white mt-1">{latency} ms</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms, streams, hosts..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center">
          <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Watch Parties Found</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
            There are no active public parties matching your search. Create one now and share with friends!
          </p>
          <button
            onClick={onCreateRoom}
            className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Create First Watch Party
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
          ))}
        </div>
      )}

    </div>
  );
};
