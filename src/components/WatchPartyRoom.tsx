import React, { useState } from 'react';
import { ArrowLeft, Share2, Copy, Check, Lock, Globe, Sparkles, RefreshCw, Radio, Layers, MessageSquare, Users } from 'lucide-react';
import { Room, User, FloatingReaction, ChatMessage } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { LiveChat } from './LiveChat';
import { ParticipantsList } from './ParticipantsList';
import { VoiceChat } from './VoiceChat';
import { FloatingReactions } from './FloatingReactions';
import { PRESET_MEDIA } from '../data/presetMedia';

interface WatchPartyRoomProps {
  room: Room;
  currentUser: User | null;
  onLeaveRoom: () => void;
  onControlPlayback: (action: 'play' | 'pause' | 'seek' | 'rateChange', currentTime: number, playbackRate?: number) => void;
  onSendMessage: (text: string, type?: 'message' | 'reaction' | 'gif', reactionEmoji?: string) => void;
  onTriggerFloatingReaction: (emoji: string) => void;
  floatingReactions: FloatingReaction[];
  onToggleVoiceState: (isMuted: boolean, isDeafened: boolean) => void;
  onTransferHost: (newHostId: string) => void;
  onChangeMedia: (media: Room['media']) => void;
  syncDrift: number;
}

export const WatchPartyRoom: React.FC<WatchPartyRoomProps> = ({
  room,
  currentUser,
  onLeaveRoom,
  onControlPlayback,
  onSendMessage,
  onTriggerFloatingReaction,
  floatingReactions,
  onToggleVoiceState,
  onTransferHost,
  onChangeMedia,
  syncDrift
}) => {
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'watchers'>('chat');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChangeMediaModal, setShowChangeMediaModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [customMediaTitle, setCustomMediaTitle] = useState('');

  const isHost = room.hostId === currentUser?.id;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelectMedia = (media: Room['media']) => {
    onChangeMedia(media);
    setShowChangeMediaModal(false);
  };

  const handleCustomMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMediaUrl) return;
    onChangeMedia({
      type: customMediaUrl.includes('youtube.com') || customMediaUrl.includes('youtu.be') ? 'youtube' : 'mp4',
      url: customMediaUrl,
      title: customMediaTitle || 'Custom Stream Stream',
      duration: 300,
      posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80'
    });
    setShowChangeMediaModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800/80 shadow-xl">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveRoom}
            className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">{room.name}</h2>
              {room.passwordRequired ? (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  PRIVATE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  PUBLIC
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Host: <strong className="text-zinc-200">{room.hostName}</strong></span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">{room.category}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setShowChangeMediaModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Change Stream</span>
            </button>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Video Stage + Side Chat/Watchers Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Video Player & Voice Controls */}
        <div className="lg:col-span-2 space-y-4 relative">
          
          {/* Floating Reactions Render Layer */}
          <FloatingReactions reactions={floatingReactions} />

          {/* Synchronized Video Player */}
          <VideoPlayer
            room={room}
            isHost={isHost}
            onControlPlayback={onControlPlayback}
            onTriggerReaction={onTriggerFloatingReaction}
            onChangeMediaModal={() => setShowChangeMediaModal(true)}
            syncDrift={syncDrift}
          />

          {/* WebRTC Voice Chat Bar */}
          <VoiceChat
            participants={room.participants}
            currentUser={currentUser}
            onToggleState={onToggleVoiceState}
          />

          {/* Room Description & Stream Details */}
          <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              About Stream
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {room.description || "Join us in synchronized video watching!"}
            </p>
            <div className="pt-2 text-[11px] text-zinc-400 flex items-center gap-4">
              <span>Playing: <strong className="text-indigo-300">{room.media.title}</strong></span>
              <span>Capacity: <strong className="text-white">{room.participants.length}/{room.maxParticipants}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Col: Tabbed Side Panel (Live Chat + Watchers List) */}
        <div className="lg:col-span-1 flex flex-col h-full space-y-4">
          
          {/* Side Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
            <button
              onClick={() => setActiveSideTab('chat')}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSideTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Live Chat
            </button>

            <button
              onClick={() => setActiveSideTab('watchers')}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSideTab === 'watchers'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Watchers ({room.participants.length})
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 min-h-[460px]">
            {activeSideTab === 'chat' ? (
              <LiveChat
                messages={room.messages}
                onSendMessage={onSendMessage}
                currentUser={currentUser}
              />
            ) : (
              <ParticipantsList
                participants={room.participants}
                currentUserId={currentUser?.id}
                isHost={isHost}
                onTransferHost={onTransferHost}
              />
            )}
          </div>

        </div>

      </div>

      {/* Share / Invite Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2">Invite Friends to Watch Party</h3>
            <p className="text-xs text-zinc-400 mb-4">Share this link with your friends to stream together in real-time.</p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-indigo-300 font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {room.passwordRequired && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-4">
                🔒 Password required for entry: <strong className="font-mono text-white ml-1">{room.password}</strong>
              </div>
            )}

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Change Media Stream Modal (Host Only) */}
      {showChangeMediaModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1">Change Stream Video</h3>
            <p className="text-xs text-zinc-400 mb-4">Pick a video from presets or paste a custom MP4 / YouTube link.</p>

            {/* Presets List */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Presets</h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_MEDIA.map(preset => (
                  <div
                    key={preset.url}
                    onClick={() => handleSelectMedia(preset)}
                    className="p-2.5 rounded-2xl bg-zinc-950 hover:bg-indigo-950/40 border border-zinc-800/80 hover:border-indigo-500/50 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={preset.posterUrl} alt={preset.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{preset.title}</p>
                        <p className="text-[10px] text-zinc-400">{preset.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Link Form */}
            <form onSubmit={handleCustomMediaSubmit} className="space-y-3 pt-3 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Or Paste Custom Stream Link</h4>
              <input
                type="url"
                required
                value={customMediaUrl}
                onChange={(e) => setCustomMediaUrl(e.target.value)}
                placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
              />
              <input
                type="text"
                value={customMediaTitle}
                onChange={(e) => setCustomMediaTitle(e.target.value)}
                placeholder="Video Title"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeMediaModal(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Update Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
