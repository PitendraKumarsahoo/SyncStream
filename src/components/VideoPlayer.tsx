import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, FastForward, Sparkles, Radio, RefreshCw, Volume1 } from 'lucide-react';
import { Room } from '../types';
import { socketService } from '../lib/socket';

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
  const isRemoteUpdateRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(room.playback.isPlaying);
  const [currentTime, setCurrentTime] = useState(room.playback.currentTime);
  const [duration, setDuration] = useState(room.media.duration || 100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(room.playback.playbackRate || 1.0);
  const [showControls, setShowControls] = useState(true);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync video element with room playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    isRemoteUpdateRef.current = true;

    const targetTime = room.playback.currentTime;
    const diff = Math.abs(video.currentTime - targetTime);

    if (diff > 0.6) {
      video.currentTime = targetTime;
    }

    if (room.playback.isPlaying) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setNeedsUserInteraction(false);
            })
            .catch(() => {
              // Try muted playback as fallback for strict browser autoplay policies
              video.muted = true;
              setIsMuted(true);
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setNeedsUserInteraction(true); // Show banner to unmute
                })
                .catch(() => {
                  setIsPlaying(false);
                  setNeedsUserInteraction(true);
                });
            })
            .finally(() => {
              setTimeout(() => {
                isRemoteUpdateRef.current = false;
              }, 150);
            });
        }
      } else {
        setIsPlaying(true);
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 150);
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
      setIsPlaying(false);
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 150);
    }

    if (video.playbackRate !== room.playback.playbackRate) {
      video.playbackRate = room.playback.playbackRate;
      setPlaybackRate(room.playback.playbackRate);
    }
  }, [room.playback]);

  // Periodic heartbeat sync ping to keep room time live
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        socketService.getSocket().emit('playback:ping', {
          roomId: room.id,
          currentTime: video.currentTime,
          isPlaying: true
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, room.id]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || duration);
    }
  };

  const handleNativePlay = () => {
    setIsPlaying(true);
    if (!isRemoteUpdateRef.current && videoRef.current) {
      onControlPlayback('play', videoRef.current.currentTime);
    }
  };

  const handleNativePause = () => {
    setIsPlaying(false);
    if (!isRemoteUpdateRef.current && videoRef.current) {
      onControlPlayback('pause', videoRef.current.currentTime);
    }
  };

  const handleUnlockAndPlay = () => {
    setNeedsUserInteraction(false);
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume || 1;
      video.currentTime = room.playback.currentTime;
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          onControlPlayback('play', video.currentTime);
        })
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play();
          setIsPlaying(true);
        });
    }
  };

  const togglePlay = () => {
    setNeedsUserInteraction(false);
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (videoRef.current) {
      if (nextState) {
        videoRef.current
          .play()
          .then(() => {
            onControlPlayback('play', videoRef.current!.currentTime);
          })
          .catch(() => {
            setNeedsUserInteraction(true);
          });
      } else {
        videoRef.current.pause();
        onControlPlayback('pause', videoRef.current.currentTime);
      }
    } else {
      onControlPlayback(nextState ? 'play' : 'pause', currentTime);
    }
  };

  const handleSkip = (seconds: number) => {
    setNeedsUserInteraction(false);
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    onControlPlayback('seek', newTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNeedsUserInteraction(false);
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    onControlPlayback('seek', newTime);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    onControlPlayback('rateChange', currentTime, rate);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (needsUserInteraction && isMuted) {
        setNeedsUserInteraction(false);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
      if (newVol > 0 && needsUserInteraction) {
        setNeedsUserInteraction(false);
      }
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

  // Extract Youtube Embed URL safely
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else {
      videoId = url.split('/').pop() || '';
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=1`;
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
          src={getYoutubeEmbedUrl(room.media.url)}
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
          onPlay={handleNativePlay}
          onPause={handleNativePause}
          onEnded={() => {
            setIsPlaying(false);
            if (!isRemoteUpdateRef.current) {
              onControlPlayback('pause', videoRef.current?.duration || currentTime);
            }
          }}
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* Autoplay / Audio Unlock Banner Overlay */}
      {needsUserInteraction && room.media.type !== 'youtube' && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="p-4 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 mb-3 animate-bounce">
            <Volume1 className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight mb-1">
            Click to Play & Unmute Video Stream
          </h3>
          <p className="text-xs text-zinc-300 max-w-sm mb-4 leading-relaxed">
            Your browser requires a user click to enable synchronized video audio for watch party members.
          </p>
          <button
            onClick={handleUnlockAndPlay}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Synchronized Movie Stream</span>
          </button>
        </div>
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
            <span>LIVE WATCH PARTY</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-white font-bold bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span>{room.media.title}</span>
          </div>
        </div>

        {/* Sync Status Badge & Change Stream */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 transition-all active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Skip Backward -10s ("Piche") */}
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-10s</span>
            </button>

            {/* Skip Forward +10s ("Age") */}
            <button
              onClick={() => handleSkip(10)}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              title="Fast Forward 10 seconds"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>+10s</span>
            </button>

            {/* Time Display */}
            <div className="text-xs font-mono text-zinc-300 font-bold ml-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-zinc-500 mx-1">/</span>
              <span className="text-zinc-500">{formatTime(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-2 group/vol ml-2">
              <button onClick={toggleMute} className="text-zinc-300 hover:text-white cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-20 h-1 bg-zinc-700 rounded-lg appearance-none accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Speed & Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    playbackRate === rate ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
