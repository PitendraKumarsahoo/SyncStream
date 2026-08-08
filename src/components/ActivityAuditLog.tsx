import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  FastForward, 
  Video, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Settings, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Check, 
  Clock, 
  Radio, 
  Volume2, 
  ShieldCheck, 
  Copy,
  Info
} from 'lucide-react';
import { Room, User, ChatMessage } from '../types';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  actor: {
    name: string;
    avatar?: string;
    isHost?: boolean;
  };
  category: 'playback' | 'media' | 'member' | 'host' | 'system';
  action: string;
  details: string;
  iconType: 'play' | 'pause' | 'seek' | 'video' | 'user-plus' | 'user-minus' | 'crown' | 'settings' | 'system' | 'speed';
}

interface ActivityAuditLogProps {
  room: Room;
  currentUser: User | null;
  socket?: any;
}

export const ActivityAuditLog: React.FC<ActivityAuditLogProps> = ({
  room,
  currentUser,
  socket
}) => {
  const [logEntries, setLogEntries] = useState<AuditLogEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'host' | 'playback' | 'media' | 'member'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedExport, setCopiedExport] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Helper to format timestamps into clean time strings (e.g., 10:42:15 AM)
  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper to calculate relative time (e.g. "Just now", "2m ago")
  const formatRelativeTime = (ts: number): string => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  // Helper to convert room system messages into AuditLogEntry objects
  useEffect(() => {
    const initialEntries: AuditLogEntry[] = [];

    // Room Creation entry
    if (room.createdAt) {
      const createTs = new Date(room.createdAt).getTime() || Date.now() - 300000;
      initialEntries.push({
        id: `audit-created-${room.id}`,
        timestamp: createTs,
        formattedTime: formatTime(createTs),
        actor: {
          name: room.hostName || 'Host',
          avatar: room.hostAvatar,
          isHost: true
        },
        category: 'host',
        action: 'Room Initialized',
        details: `Created watch party room "${room.name}" in category ${room.category}`,
        iconType: 'crown'
      });
    }

    // Initial Media entry
    if (room.media) {
      const mediaTs = new Date(room.createdAt).getTime() || Date.now() - 290000;
      initialEntries.push({
        id: `audit-media-${room.id}`,
        timestamp: mediaTs,
        formattedTime: formatTime(mediaTs),
        actor: {
          name: room.hostName || 'Host',
          avatar: room.hostAvatar,
          isHost: true
        },
        category: 'media',
        action: 'Media Loaded',
        details: `Set primary video source to "${room.media.title}" (${room.media.type.toUpperCase()})`,
        iconType: 'video'
      });
    }

    // Convert existing room system chat messages
    room.messages.forEach((msg) => {
      if (msg.type === 'system') {
        let cat: AuditLogEntry['category'] = 'system';
        let icon: AuditLogEntry['iconType'] = 'system';
        let action = 'System Alert';

        if (msg.text.includes('joined')) {
          cat = 'member';
          icon = 'user-plus';
          action = 'Member Joined';
        } else if (msg.text.includes('left')) {
          cat = 'member';
          icon = 'user-minus';
          action = 'Member Left';
        } else if (msg.text.includes('media') || msg.text.includes('stream') || msg.text.includes('changed')) {
          cat = 'media';
          icon = 'video';
          action = 'Media Change';
        } else if (msg.text.includes('host') || msg.text.includes('created')) {
          cat = 'host';
          icon = 'crown';
          action = 'Host Event';
        }

        initialEntries.push({
          id: `audit-msg-${msg.id}`,
          timestamp: msg.timestamp,
          formattedTime: formatTime(msg.timestamp),
          actor: {
            name: msg.senderName || 'System',
            avatar: msg.senderAvatar
          },
          category: cat,
          action,
          details: msg.text,
          iconType: icon
        });
      }
    });

    // Deduplicate and set initial logs
    setLogEntries(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newItems = initialEntries.filter(e => !existingIds.has(e.id));
      return [...prev, ...newItems].sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [room.id, room.messages.length]);

  // Real-time socket event listener for live activity logging
  useEffect(() => {
    if (!socket) return;

    const handlePlaybackUpdated = (payload: any) => {
      const ts = Date.now();
      const actorName = payload.initiatedBy || 'Host';
      const isHost = actorName === room.hostName;

      let actionText = 'Playback Event';
      let icon: AuditLogEntry['iconType'] = 'play';
      let detailsText = '';

      const formatSecs = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      };

      const timeStr = payload.playback?.currentTime !== undefined ? formatSecs(payload.playback.currentTime) : '00:00';

      switch (payload.action) {
        case 'play':
          actionText = 'Playback Resumed';
          icon = 'play';
          detailsText = `Resumed video playback at ${timeStr}`;
          break;
        case 'pause':
          actionText = 'Playback Paused';
          icon = 'pause';
          detailsText = `Paused video stream at timestamp ${timeStr}`;
          break;
        case 'seek':
          actionText = 'Timeline Seeked';
          icon = 'seek';
          detailsText = `Jumped video position to ${timeStr}`;
          break;
        case 'rateChange':
          actionText = 'Speed Changed';
          icon = 'speed';
          detailsText = `Set playback speed multiplier to ${payload.playback?.playbackRate || 1.0}x`;
          break;
        default:
          actionText = 'Playback Action';
          detailsText = `Triggered ${payload.action} action at ${timeStr}`;
      }

      const newEntry: AuditLogEntry = {
        id: `audit-pb-${ts}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: ts,
        formattedTime: formatTime(ts),
        actor: {
          name: actorName,
          isHost
        },
        category: 'playback',
        action: actionText,
        details: detailsText,
        iconType: icon
      };

      setLogEntries(prev => [newEntry, ...prev]);
    };

    const handleMediaChanged = (payload: any) => {
      const ts = Date.now();
      const mediaTitle = payload.media?.title || 'Custom Video';
      const mediaType = (payload.media?.type || 'mp4').toUpperCase();

      const newEntry: AuditLogEntry = {
        id: `audit-media-${ts}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: ts,
        formattedTime: formatTime(ts),
        actor: {
          name: room.hostName || 'Host',
          isHost: true
        },
        category: 'media',
        action: 'Media Source Changed',
        details: `Updated active media to "${mediaTitle}" [${mediaType}]`,
        iconType: 'video'
      };

      setLogEntries(prev => [newEntry, ...prev]);
    };

    const handleUserJoined = (payload: any) => {
      if (!payload.participant) return;
      const ts = Date.now();
      const newEntry: AuditLogEntry = {
        id: `audit-join-${ts}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: ts,
        formattedTime: formatTime(ts),
        actor: {
          name: payload.participant.name,
          avatar: payload.participant.avatar,
          isHost: payload.participant.isHost
        },
        category: 'member',
        action: 'User Joined',
        details: `${payload.participant.name} connected to the room session`,
        iconType: 'user-plus'
      };

      setLogEntries(prev => [newEntry, ...prev]);
    };

    const handleUserLeft = (payload: any) => {
      const ts = Date.now();
      const name = payload.participantName || payload.systemMessage?.text?.split(' ')[0] || 'A user';
      const newEntry: AuditLogEntry = {
        id: `audit-leave-${ts}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: ts,
        formattedTime: formatTime(ts),
        actor: {
          name
        },
        category: 'member',
        action: 'User Left',
        details: `${name} disconnected from the watch party`,
        iconType: 'user-minus'
      };

      setLogEntries(prev => [newEntry, ...prev]);
    };

    const handleHostTransferred = (payload: any) => {
      const ts = Date.now();
      const newEntry: AuditLogEntry = {
        id: `audit-host-${ts}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: ts,
        formattedTime: formatTime(ts),
        actor: {
          name: payload.newHostName || 'New Host',
          isHost: true
        },
        category: 'host',
        action: 'Host Transferred',
        details: `Room ownership and control permissions transferred to ${payload.newHostName || 'new member'}`,
        iconType: 'crown'
      };

      setLogEntries(prev => [newEntry, ...prev]);
    };

    socket.on('playback:updated', handlePlaybackUpdated);
    socket.on('room:media-changed', handleMediaChanged);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('host:transferred', handleHostTransferred);

    return () => {
      socket.off('playback:updated', handlePlaybackUpdated);
      socket.off('room:media-changed', handleMediaChanged);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('host:transferred', handleHostTransferred);
    };
  }, [socket, room.hostName]);

  // Filter and search computation
  const filteredEntries = useMemo(() => {
    return logEntries
      .filter(entry => {
        // Category Filter
        if (activeFilter === 'host' && entry.category !== 'host') return false;
        if (activeFilter === 'playback' && entry.category !== 'playback') return false;
        if (activeFilter === 'media' && entry.category !== 'media') return false;
        if (activeFilter === 'member' && entry.category !== 'member') return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchActor = entry.actor.name.toLowerCase().includes(q);
          const matchAction = entry.action.toLowerCase().includes(q);
          const matchDetails = entry.details.toLowerCase().includes(q);
          return matchActor || matchAction || matchDetails;
        }

        return true;
      })
      .sort((a, b) => sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
  }, [logEntries, activeFilter, searchQuery, sortOrder]);

  const handleExportLogs = () => {
    const textLog = filteredEntries.map(e => 
      `[${e.formattedTime}] [${e.category.toUpperCase()}] ${e.actor.name}: ${e.action} - ${e.details}`
    ).join('\n');

    navigator.clipboard.writeText(`--- Watch Party Activity Audit Log: ${room.name} ---\n${textLog}`);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear activity audit log history for this session?')) {
      setLogEntries([]);
    }
  };

  const renderIcon = (iconType: AuditLogEntry['iconType']) => {
    switch (iconType) {
      case 'play': return <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />;
      case 'pause': return <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />;
      case 'seek': return <FastForward className="w-3.5 h-3.5 text-sky-400" />;
      case 'video': return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case 'user-plus': return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      case 'user-minus': return <UserMinus className="w-3.5 h-3.5 text-rose-400" />;
      case 'crown': return <Crown className="w-3.5 h-3.5 text-amber-300" />;
      case 'speed': return <Radio className="w-3.5 h-3.5 text-teal-400" />;
      case 'settings': return <Settings className="w-3.5 h-3.5 text-zinc-400" />;
      default: return <Info className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getCategoryBadgeClass = (category: AuditLogEntry['category']) => {
    switch (category) {
      case 'playback': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'media': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'member': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'host': return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
      {/* Audit Log Header */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                Audit Log
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[10px] text-zinc-400">Host & room action timeline</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportLogs}
              title="Copy Activity Log Summary"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer border border-zinc-700/50"
            >
              {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-medium hidden sm:inline">{copiedExport ? 'Copied' : 'Export'}</span>
            </button>
            <button
              onClick={handleClearLogs}
              title="Clear Local Audit Logs"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all text-xs cursor-pointer border border-zinc-700/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search actions, host, media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Clock className="w-3 h-3 text-indigo-400" />
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {(['all', 'host', 'playback', 'media', 'member'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 border ${
                activeFilter === filter
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-600">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-400">No audit events match filter</p>
            <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px]">
              {searchQuery ? `No logs found for "${searchQuery}"` : 'Host actions and stream events will log here in real-time.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="group p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/80 transition-all flex items-start gap-2.5 relative"
            >
              {/* Category Icon */}
              <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
                {renderIcon(entry.iconType)}
              </div>

              {/* Event Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {entry.actor.name}
                      {entry.actor.isHost && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Host" />
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {entry.action}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-zinc-500 shrink-0" title={formatRelativeTime(entry.timestamp)}>
                    {entry.formattedTime}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed font-normal break-words">
                  {entry.details}
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getCategoryBadgeClass(entry.category)}`}>
                    {entry.category}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Summary Bar */}
      <div className="p-2.5 bg-zinc-900/80 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 shrink-0">
        <span className="flex items-center gap-1 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Audit logging active
        </span>
        <span className="font-semibold text-zinc-300">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'event' : 'events'}
        </span>
      </div>
    </div>
  );
};
