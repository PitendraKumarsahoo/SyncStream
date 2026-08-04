import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, FastForward, Shield, Sparkles, Radio, Settings, Lock, RefreshCw, Layers } from 'lucide-react';
import { Room, Participant } from '../types';

interface VideoPlayerProps {
  room: Room;
  isHost: boolean;
  onControlPlayback: (action: 'play' | 'pause' | 'seek' | 'rateChange', currentTime: number, playbackRate?: number) => void;
  onTriggerReaction: (emoji: string) => void;
  onChangeMediaModal: () => void;
  syncDrift: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  room,
  isHost,
  onControlPlayback,
  onTriggerReaction,
  onChangeMediaModal,
  syncDrift
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(room.playback.isPlaying);
  const [currentTime, setCurrentTime] = useState(room.playback.currentTime);
  const [duration, setDuration] = useState(room.media.duration || 100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(room.playback.playbackRate || 1.0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync video element with room playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check drift vs room playback
    const targetTime = room.playback.currentTime;
    const diff = Math.abs(video.currentTime - targetTime);

    if (diff > 0.5) {
      video.currentTime = targetTime;
    }

    if (room.playback.isPlaying && video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else if (!room.playback.isPlaying && !video.paused) {
      video.pause();
      setIsPlaying(false);
    }

    if (video.playbackRate !== room.playback.playbackRate) {
      video.playbackRate = room.playback.playbackRate;
      setPlaybackRate(room.playback.playbackRate);
    }
  }, [room.playback]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || duration);
    }
  };

  const togglePlay = () => {
    if (!isHost) return; // Only host controls play/pause unless permission granted
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (videoRef.current) {
      if (nextState) {
        videoRef.current.play();
        onControlPlayback('play', videoRef.current.currentTime);
      } else {
        videoRef.current.pause();
        onControlPlayback('pause', videoRef.current.currentTime);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      onControlPlayback('seek', newTime);
    }
  };

  const handleRateChange = (rate: number) => {
    if (!isHost) return;
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      onControlPlayback('rateChange', videoRef.current.currentTime, rate);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group select-none flex items-center justify-center"
    >
      
      {/* HTML5 Video or YouTube */}
      {room.media.type === 'youtube' ? (
        <iframe
          src={`https://www.youtube.com/embed/${room.media.url.split('v=')[1] || room.media.url.split('/').pop()}?autoplay=1&enablejsapi=1`}
          title={room.media.title}
          className="w-full h-full border-0 pointer-events-auto"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={room.media.url}
          poster={room.media.posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold shadow-lg backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>LIVE SYNC</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-white font-bold bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span>{room.media.title}</span>
          </div>
        </div>

        {/* Sync Status Badge & Host Change Video */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synced ({syncDrift.toFixed(2)}s diff)</span>
          </div>

          {isHost && (
            <button
              onClick={onChangeMediaModal}
              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Change Video
            </button>
          )}
        </div>
      </div>

      {/* Center Big Host Notice if Non-Host tries to play */}
      {!isHost && !isPlaying && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
          <Lock className="w-10 h-10 text-amber-400 mb-2" />
          <h4 className="text-base font-bold text-white">Host Control Active</h4>
          <p className="text-xs text-zinc-300 max-w-sm mt-1">
            Playback is managed by the host ({room.hostName}). Sit back and enjoy the synchronized stream!
          </p>
        </div>
      )}

      {/* Floating Reactions Bar (Overlay on Bottom Left) */}
      <div
        className={`absolute bottom-20 left-4 md:left-6 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {['❤️', '🔥', '😂', '👏', '🍿', '🚀', '🎉'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onTriggerReaction(emoji)}
            className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center text-lg transition-transform active:scale-125 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Player Controls Bar at Bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Slider */}
        <div className="relative group/timeline mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            disabled={!isHost}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700/80 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all"
          />
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg pointer-events-none h-1.5 group-hover/timeline:h-2.5 transition-all"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={!isHost}
              className={`p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 transition-all cursor-pointer ${
                !isHost ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Time Display */}
            <div className="text-xs font-mono text-zinc-300 font-bold">
              <span>{formatTime(currentTime)}</span>
              <span className="text-zinc-500 mx-1">/</span>
              <span className="text-zinc-500">{formatTime(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-zinc-300 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Speed & Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            {isHost && (
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      playbackRate === rate
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
