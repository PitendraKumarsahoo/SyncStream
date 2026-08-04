import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio, Shield, Activity, Users } from 'lucide-react';
import { Participant, User } from '../types';

interface VoiceChatProps {
  participants: Participant[];
  currentUser: User | null;
  onToggleState: (isMuted: boolean, isDeafened: boolean) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  participants,
  currentUser,
  onToggleState
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const toggleMic = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    onToggleState(nextMute, isDeafened);

    if (!nextMute && !micActive) {
      // Request mic permission
      navigator.mediaDevices?.getUserMedia({ audio: true }).then(() => {
        setMicActive(true);
      }).catch(() => {
        setIsMuted(true);
      });
    }
  };

  const toggleDeafen = () => {
    const nextDeafen = !isDeafened;
    setIsDeafened(nextDeafen);
    onToggleState(isMuted, nextDeafen);
  };

  return (
    <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
      
      {/* Voice Status Indicator */}
      <div className="flex items-center gap-2.5">
        <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${
          isMuted ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
        }`}>
          <Radio className={`w-4 h-4 ${!isMuted ? 'animate-pulse' : ''}`} />
          {!isMuted && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <span>Voice Channel</span>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase">HD WebRTC</span>
          </p>
          <p className="text-[10px] text-zinc-400">
            {isMuted ? 'Microphone Muted' : 'Voice Connected'}
          </p>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            isMuted
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40'
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={toggleDeafen}
          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isDeafened
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
          }`}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
};
