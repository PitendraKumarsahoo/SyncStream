import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, FastForward, Sparkles, Radio, RefreshCw, Volume1, AlertTriangle, Film } from 'lucide-react';
import { Room, MediaItem } from '../types';
import { socketService } from '../lib/socket';
import { PRESET_MEDIA } from '../data/presetMedia';

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
  const [duration, setDuration] = useState<number>(room.media.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(room.playback.playbackRate || 1.0);
  const [showControls, setShowControls] = useState(true);
  
  // Audio unlock and video error states
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userHasUnlocked, setUserHasUnlocked] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset video states on room media update
  useEffect(() => {
    setHasVideoError(false);
    setErrorMessage('');
    if (room.media.duration) {
      setDuration(room.media.duration);
    }
  }, [room.media.url]);

  // Sync video element with room playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || room.media.type === 'youtube') return;

    isRemoteUpdateRef.current = true;

    const targetTime = room.playback.currentTime;
    setCurrentTime(targetTime);

    const diff = Math.abs(video.currentTime - targetTime);

    // Lock-step force-sync when drift is > 0.4 seconds
    if (diff > 0.4) {
      video.currentTime = targetTime;
    }

    if (room.playback.isPlaying) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setNeedsAudioUnlock(false);
            })
            .catch(() => {
              // Browser autoplay policy blocked unmuted audio -> try muted autoplay
              video.muted = true;
              setIsMuted(true);
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                  if (!userHasUnlocked) {
                    setNeedsAudioUnlock(true);
                  }
                })
                .catch(() => {
                  setIsPlaying(false);
                  if (!userHasUnlocked) {
                    setNeedsAudioUnlock(true);
                  }
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
  }, [room.playback.currentTime, room.playback.isPlaying, room.playback.playbackRate, room.playback.lastUpdated, room.media.type, userHasUnlocked]);

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

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setDuration(dur);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && duration !== dur) {
        setDuration(dur);
      }
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

  const handleVideoError = () => {
    setHasVideoError(true);
    setIsPlaying(false);
    setNeedsAudioUnlock(false);

    const url = room.media.url || '';
    if (url.toLowerCase().endsWith('.mkv') || url.includes('.mkv?')) {
      setErrorMessage('MKV format (.mkv) is not natively playable in web browsers. Please select a featured movie or provide a direct MP4/YouTube stream link.');
    } else if (url.startsWith('blob:')) {
      setErrorMessage('Local file blob URLs are only accessible on your local device. To watch together with friends across devices, select a featured movie or paste a public video link.');
    } else {
      setErrorMessage('Unable to play video stream. The media URL may be expired, broken, or restricted by browser CORS policy.');
    }
  };

  const handleUnlockAudio = () => {
    setUserHasUnlocked(true);
    setNeedsAudioUnlock(false);
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume || 1;
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
        });
    }
  };

  const togglePlay = () => {
    if (hasVideoError) return;
    setUserHasUnlocked(true);
    setNeedsAudioUnlock(false);
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
            setNeedsAudioUnlock(true);
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
    if (hasVideoError) return;
    setUserHasUnlocked(true);
    setNeedsAudioUnlock(false);
    const newTime = Math.max(0, Math.min(duration || 1000, currentTime + seconds));
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    onControlPlayback('seek', newTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasVideoError) return;
    setUserHasUnlocked(true);
    setNeedsAudioUnlock(false);
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
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
      if (!nextMute) {
        setUserHasUnlocked(true);
        setNeedsAudioUnlock(false);
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
      if (newVol > 0) {
        setUserHasUnlocked(true);
        setNeedsAudioUnlock(false);
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
    if (!secs || isNaN(secs) || !isFinite(secs)) return '00:00';
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
      {/* Video stream, YouTube or Error State */}
      {hasVideoError ? (
        <div className="absolute inset-0 z-30 bg-zinc-950/95 p-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto animate-fadeIn">
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white mb-1 tracking-tight">
            Stream Playback Error
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed mb-4">
            {errorMessage}
          </p>

          <div className="w-full space-y-2">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Pick a Featured Movie to Watch Now:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_MEDIA.slice(0, 4).map((preset) => (
                <button
                  key={preset.url}
                  onClick={() => {
                    setHasVideoError(false);
                    onControlPlayback('seek', 0);
                    socketService.getSocket().emit('room:update-media', {
                      roomId: room.id,
                      media: preset
                    });
                  }}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-indigo-950/60 border border-zinc-800 hover:border-indigo-500/50 text-left flex items-center gap-2 transition-all cursor-pointer"
                >
                  <img src={preset.posterUrl} alt={preset.title} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">{preset.title}</p>
                    <p className="text-[9px] text-indigo-400 font-semibold">1080p Stream</p>
                  </div>
                </button>
              ))}
            </div>

            {isHost && (
              <button
                onClick={onChangeMediaModal}
                className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Open Custom Video Picker
              </button>
            )}
          </div>
        </div>
      ) : room.media.type === 'youtube' ? (
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
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handleNativePlay}
          onPause={handleNativePause}
          onError={handleVideoError}
          onEnded={() => {
            setIsPlaying(false);
            if (!isRemoteUpdateRef.current) {
              onControlPlayback('pause', videoRef.current?.duration || currentTime);
            }
          }}
          playsInline
          preload="auto"
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* Non-intrusive Floating Unmute Audio Pill */}
      {needsAudioUnlock && !hasVideoError && room.media.type !== 'youtube' && (
        <div className="absolute top-16 z-30 animate-bounce">
          <button
            onClick={handleUnlockAudio}
            className="px-4 py-2 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-xl border border-indigo-400/50 backdrop-blur-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Volume1 className="w-4 h-4 text-indigo-200" />
            <span>Click to Unmute Audio Stream</span>
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
            <Film className="w-3.5 h-3.5 text-indigo-400" />
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

      {/* Floating Reactions Bar */}
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
            disabled={hasVideoError}
            className="w-full h-1.5 bg-zinc-700/80 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all disabled:opacity-50"
          />
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg pointer-events-none h-1.5 group-hover/timeline:h-2.5 transition-all"
            style={{ width: `${((currentTime / (duration || 1)) * 100) || 0}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={hasVideoError}
              className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Skip Backward -10s */}
            <button
              onClick={() => handleSkip(-10)}
              disabled={hasVideoError}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold disabled:opacity-50 cursor-pointer"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-10s</span>
            </button>

            {/* Skip Forward +10s */}
            <button
              onClick={() => handleSkip(10)}
              disabled={hasVideoError}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold disabled:opacity-50 cursor-pointer"
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
