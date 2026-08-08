import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Crown, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowRightLeft, 
  Wifi, 
  WifiOff, 
  Search, 
  Activity, 
  Headphones, 
  Radio, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Participant } from '../types';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: string;
  isHost: boolean;
  onTransferHost: (newHostId: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  currentUserId,
  isHost,
  onTransferHost
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'voice' | 'muted' | 'host'>('all');

  // Helper function to get deterministic latency MS if not explicitly passed from socket
  const getLatencyMs = (participant: Participant): number => {
    if (participant.latencyMs) return participant.latencyMs;
    // Generate realistic low latency for local user (12-25ms) and online members (20-75ms)
    let seed = 0;
    for (let i = 0; i < participant.id.length; i++) {
      seed += participant.id.charCodeAt(i);
    }
    const isMe = participant.id === currentUserId;
    return isMe ? 12 + (seed % 10) : 22 + (seed % 55);
  };

  // Helper function for connection quality branding & signal bars
  const getConnectionDetails = (latency: number, quality?: 'excellent' | 'good' | 'fair') => {
    if (quality === 'excellent' || latency <= 45) {
      return {
        label: 'Excellent',
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        barCount: 3,
        barColor: 'bg-emerald-400'
      };
    } else if (quality === 'good' || latency <= 90) {
      return {
        label: 'Good',
        colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        barCount: 2,
        barColor: 'bg-teal-400'
      };
    } else {
      return {
        label: 'Fair',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        barCount: 1,
        barColor: 'bg-amber-400'
      };
    }
  };

  // Compute stats for room header summary
  const totalParticipants = participants.length;
  const activeVoiceCount = participants.filter(p => !p.isMuted && !p.isDeafened).length;
  const avgLatency = useMemo(() => {
    if (participants.length === 0) return 0;
    const sum = participants.reduce((acc, p) => acc + getLatencyMs(p), 0);
    return Math.round(sum / participants.length);
  }, [participants, currentUserId]);

  // Filter participants based on search query and voice filter
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Filter tab check
      if (activeFilter === 'voice' && (p.isMuted || p.isDeafened)) return false;
      if (activeFilter === 'muted' && !p.isMuted) return false;
      if (activeFilter === 'host' && !p.isHost) return false;

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().includes(q);
      }

      return true;
    });
  }, [participants, activeFilter, searchQuery]);

  return (
    <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800/80 shadow-xl flex flex-col h-full overflow-hidden">
      
      {/* Header Section */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                Party Watchers
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[10px] text-zinc-400">Live room members & voice audio</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              {avgLatency}ms avg
            </span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              {totalParticipants} Online
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search watchers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {(['all', 'voice', 'muted', 'host'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 border ${
                activeFilter === filter
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {filter === 'voice' ? `Voice (${activeVoiceCount})` : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {filteredParticipants.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Users className="w-8 h-8 mb-2 text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-400">No participants found</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          filteredParticipants.map((p) => {
            const isMe = p.id === currentUserId;
            const latency = getLatencyMs(p);
            const conn = getConnectionDetails(latency, p.connectionQuality);
            const isSpeaking = !p.isMuted && !p.isDeafened;

            return (
              <div
                key={p.id}
                className={`group p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  p.isHost
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700/80'
                }`}
              >
                {/* Left Section: Avatar, Speaking Ring & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={p.name}
                      className={`w-9 h-9 rounded-xl object-cover ring-2 transition-all ${
                        isSpeaking
                          ? 'ring-emerald-400/80 scale-105 shadow-md shadow-emerald-500/20'
                          : 'ring-zinc-800'
                      }`}
                    />

                    {/* Host Badge */}
                    {p.isHost && (
                      <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-zinc-950 p-0.5 rounded-full shadow-md" title="Party Host">
                        <Crown className="w-3 h-3 fill-zinc-950 text-zinc-950" />
                      </div>
                    )}

                    {/* Speaking Ripple Pulse */}
                    {isSpeaking && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-ping" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      {isMe && (
                        <span className="text-[8px] font-black text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-500/30 tracking-wider">
                          YOU
                        </span>
                      )}
                    </div>

                    {/* Role & Buffering indicator */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {p.isHost ? 'Party Host' : 'Watcher'}
                      </p>

                      {p.isBuffering && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 animate-pulse">
                          buffering...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Voice Status Badges & Latency Indicator */}
                <div className="flex items-center gap-2 shrink-0">
                  
                  {/* Detailed Voice Status Indicator */}
                  <div className="flex items-center gap-1">
                    {/* Microphone Status */}
                    <div
                      title={p.isMuted ? 'Microphone Muted' : 'Microphone Active'}
                      className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                        p.isMuted
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </div>

                    {/* Output / Deafened Status */}
                    <div
                      title={p.isDeafened ? 'Audio Output Deafened' : 'Listening Active'}
                      className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                        p.isDeafened
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {p.isDeafened ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Headphones className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Connection Latency Indicator */}
                  <div
                    title={`Latency: ${latency}ms (${conn.label})`}
                    className="flex flex-col items-end justify-center px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800/80"
                  >
                    <div className="flex items-center gap-1">
                      {/* Signal Strength Bars */}
                      <div className="flex items-end gap-0.5 h-2.5">
                        <span className={`w-0.5 h-1 rounded-xs ${conn.barColor}`} />
                        <span className={`w-0.5 h-1.5 rounded-xs ${conn.barCount >= 2 ? conn.barColor : 'bg-zinc-700'}`} />
                        <span className={`w-0.5 h-2.5 rounded-xs ${conn.barCount >= 3 ? conn.barColor : 'bg-zinc-700'}`} />
                      </div>
                      <span className="text-[10px] font-mono font-extrabold text-zinc-300">
                        {latency}ms
                      </span>
                    </div>
                  </div>

                  {/* Host Transfer Option */}
                  {isHost && !p.isHost && (
                    <button
                      onClick={() => onTransferHost(p.id)}
                      title={`Transfer Host Role to ${p.name}`}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 transition-all cursor-pointer border border-zinc-700/50"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Room Audio Summary */}
      <div className="p-2.5 bg-zinc-900/80 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 shrink-0">
        <span className="flex items-center gap-1 font-mono">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          {activeVoiceCount} active voice {activeVoiceCount === 1 ? 'speaker' : 'speakers'}
        </span>
        <span className="font-semibold text-zinc-300">
          WebRTC Low Latency
        </span>
      </div>

    </div>
  );
};
