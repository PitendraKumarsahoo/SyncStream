import React from 'react';
import { Users, Crown, Mic, MicOff, Shield, UserMinus, ArrowRightLeft, Radio, Check } from 'lucide-react';
import { Participant, User } from '../types';

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
  return (
    <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800/80 p-4 shadow-xl flex flex-col space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Party Watchers</h3>
        </div>
        <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          {participants.length} Online
        </span>
      </div>

      {/* Participants List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {participants.map((p) => {
          const isMe = p.id === currentUserId;

          return (
            <div
              key={p.id}
              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                p.isHost
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={p.name}
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/30"
                  />
                  {p.isHost && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1 fill-amber-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    {isMe && (
                      <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {p.isHost ? 'Party Host' : 'Watcher'}
                  </p>
                </div>
              </div>

              {/* Status & Host Transfer */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  {p.isMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                {isHost && !p.isHost && (
                  <button
                    onClick={() => onTransferHost(p.id)}
                    title="Make Host"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
