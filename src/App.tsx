import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { WatchPartyRoom } from './components/WatchPartyRoom';
import { WatchHistoryView } from './components/WatchHistoryView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { ProfileModal } from './components/ProfileModal';
import { JoinPasswordModal } from './components/JoinPasswordModal';
import { NotificationToast } from './components/NotificationToast';
import { Room, User, SystemNotification, FloatingReaction, WatchHistoryItem } from './types';
import { socketService } from './lib/socket';

export default function App() {
  const [currentTab, setTab] = useState<'explore' | 'room' | 'history' | 'admin' | 'profile'>('explore');
  const [user, setUser] = useState<User | null>({
    id: 'usr-default-1',
    name: 'CinephileAlex',
    email: 'alex@syncstream.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'online',
    watchHistory: [],
    joinedDate: new Date().toISOString()
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [latency, setLatency] = useState(12);
  const [syncDrift, setSyncDrift] = useState(0.01);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [joinModalRoom, setJoinModalRoom] = useState<Room | null>(null);
  const [joinModalError, setJoinModalError] = useState<string | null>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const socketRef = useRef(socketService.getSocket());

  const addNotification = (title: string, message: string, type: SystemNotification['type'] = 'info') => {
    const notif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title,
      message,
      timestamp: Date.now(),
      type,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Perform HTTP Pre-Flight Room Check before Socket Join
  const performPreflightAndJoin = async (roomId: string, password?: string, fallbackRoom?: Room) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsJoiningRoom(true);

    try {
      const res = await fetch(`/api/rooms/${roomId}/preflight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || '' })
      });

      const data = await res.json().catch(() => ({ error: 'server_error' }));

      if (res.status === 404 || data.error === 'room_not_found') {
        setIsJoiningRoom(false);
        if (joinModalRoom) {
          setJoinModalError('room_not_found');
        } else {
          addNotification('Room Not Found', 'This watch party is no longer active or the link is invalid.', 'warning');
        }
        return;
      }

      if (res.status === 409 || data.error === 'room_full') {
        setIsJoiningRoom(false);
        if (joinModalRoom) {
          setJoinModalError('room_full');
        } else {
          addNotification('Room Full', 'This watch party has reached its maximum participant capacity.', 'warning');
        }
        return;
      }

      if (res.status === 401 || data.error === 'password_required' || data.error === 'invalid_password') {
        setIsJoiningRoom(false);
        const roomObj = data.room || fallbackRoom || rooms.find(r => r.id === roomId);

        if (!joinModalRoom) {
          if (roomObj) setJoinModalRoom(roomObj);
          setJoinModalError(data.error === 'invalid_password' ? 'invalid_password' : null);
        } else {
          setJoinModalError('invalid_password');
        }
        return;
      }

      if (!res.ok) {
        setIsJoiningRoom(false);
        const err = data.message || data.error || 'Unable to join watch party';
        if (joinModalRoom) {
          setJoinModalError(err);
        } else {
          addNotification('Cannot Join', err, 'warning');
        }
        return;
      }

      // Pre-flight passed successfully, proceed to connect via WebSocket
      handleJoinRoom(roomId, password);
    } catch (err) {
      setIsJoiningRoom(false);
      addNotification('Connection Error', 'Failed to reach watch party server. Please check your connection.', 'warning');
    }
  };

  // Initial Rooms Fetch & Socket Event Listeners
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetRoomId = params.get('room') || params.get('roomId');

    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRooms(data);

          // Perform preflight check for invite link room parameter on initial load
          if (targetRoomId) {
            const matching = data.find((r: Room) => r.id === targetRoomId);
            performPreflightAndJoin(targetRoomId, undefined, matching);
          }
        }
      })
      .catch(() => {});

    const socket = socketRef.current;

    socket.on('rooms:updated', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
      if (activeRoom) {
        const matching = updatedRooms.find(r => r.id === activeRoom.id);
        if (matching) setActiveRoom(matching);
      }
    });

    socket.on('user:joined', (payload) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? {
          ...prev,
          participants: payload.participants,
          messages: [...prev.messages, payload.systemMessage]
        } : null);
      }
      addNotification('User Joined', `${payload.participant.name} joined the watch party`, 'info');
    });

    socket.on('user:left', (payload) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? {
          ...prev,
          participants: payload.participants,
          messages: [...prev.messages, payload.systemMessage]
        } : null);
      }
    });

    socket.on('playback:updated', (payload) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? {
          ...prev,
          playback: payload.playback
        } : null);
      }
    });

    socket.on('playback:drift-check', (payload) => {
      const calculatedDrift = Math.abs((Date.now() - payload.serverTimestamp) / 1000);
      setSyncDrift(calculatedDrift);
    });

    socket.on('room:media-changed', (payload) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? {
          ...prev,
          media: payload.media,
          playback: payload.playback,
          messages: [...prev.messages, payload.systemMessage]
        } : null);
      }
      addNotification('Stream Updated', `Host changed media to ${payload.media.title}`, 'info');
    });

    socket.on('chat:received', (message) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message]
        } : null);
      }
    });

    socket.on('chat:floating-reaction', (payload) => {
      const reaction: FloatingReaction = {
        id: payload.id,
        emoji: payload.emoji,
        senderName: payload.senderName,
        xPercent: Math.floor(15 + Math.random() * 70)
      };
      setFloatingReactions(prev => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3200);
    });

    socket.on('participants:updated', (participants) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? { ...prev, participants } : null);
      }
    });

    socket.on('host:transferred', (payload) => {
      if (activeRoom) {
        setActiveRoom(prev => prev ? {
          ...prev,
          hostId: payload.newHostId,
          hostName: payload.newHostName,
          participants: payload.participants,
          messages: [...prev.messages, payload.systemMessage]
        } : null);
      }
      addNotification('Host Privilege Transferred', `${payload.newHostName} is now the host`, 'success');
    });

    // Latency polling
    const latencyInterval = setInterval(() => {
      setLatency(socketService.latency);
    }, 3000);

    return () => {
      clearInterval(latencyInterval);
      socket.off('rooms:updated');
      socket.off('user:joined');
      socket.off('user:left');
      socket.off('playback:updated');
      socket.off('playback:drift-check');
      socket.off('room:media-changed');
      socket.off('chat:received');
      socket.off('chat:floating-reaction');
      socket.off('participants:updated');
      socket.off('host:transferred');
    };
  }, [activeRoom]);

  // Host playback periodic ping to maintain exact time sync
  useEffect(() => {
    if (!activeRoom || !user || activeRoom.hostId !== user.id) return;

    const interval = setInterval(() => {
      socketRef.current.emit('playback:ping', {
        roomId: activeRoom.id,
        currentTime: activeRoom.playback.currentTime,
        isPlaying: activeRoom.playback.isPlaying
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRoom, user]);

  // Create Watch Party
  const handleCreateRoom = (roomData: Partial<Room>) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    socketRef.current.emit('room:create', {
      roomData,
      user: { id: user.id, name: user.name, avatar: user.avatar }
    }, (res: any) => {
      if (res && res.success) {
        setActiveRoom(res.room);
        setTab('room');
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${res.room.id}`;
        window.history.replaceState({ roomId: res.room.id }, '', newUrl);
        addNotification('Watch Party Created', `Party room "${res.room.name}" launched successfully`, 'success');
      }
    });
  };

  // Initiate Join Room (performs pre-flight check first)
  const initiateJoinRoom = (room: Room) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (room.passwordRequired || room.password) {
      setJoinModalRoom(room);
      setJoinModalError(null);
    } else {
      performPreflightAndJoin(room.id, undefined, room);
    }
  };

  // Join Watch Party with Socket
  const handleJoinRoom = (roomId: string, password?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsJoiningRoom(true);

    socketService.joinRoom({
      roomId,
      password,
      user: { id: user.id, name: user.name, avatar: user.avatar }
    }, (res: any) => {
      setIsJoiningRoom(false);
      if (res && res.success) {
        setActiveRoom(res.room);
        setTab('room');
        setJoinModalRoom(null);
        setJoinModalError(null);

        // Sync browser URL parameter for invite links
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${res.room.id}`;
        window.history.replaceState({ roomId: res.room.id }, '', newUrl);

        addNotification('Joined Watch Party', `Successfully joined ${res.room.name}`, 'success');

        // Add to watch history
        const newHistoryItem: WatchHistoryItem = {
          id: `hist-${Date.now()}`,
          roomId: res.room.id,
          roomName: res.room.name,
          mediaTitle: res.room.media.title,
          mediaUrl: res.room.media.url,
          watchedAt: new Date().toISOString(),
          durationSeconds: res.room.media.duration || 600,
          hostName: res.room.hostName
        };

        setUser(prev => prev ? {
          ...prev,
          watchHistory: [newHistoryItem, ...prev.watchHistory.filter(h => h.roomId !== res.room.id)]
        } : null);
      } else {
        const rawError = res?.error || 'server_error';
        if (rawError === 'invalid_password' || rawError === 'Incorrect room password') {
          if (!joinModalRoom) {
            const targetRoom = rooms.find(r => r.id === roomId);
            if (targetRoom) {
              setJoinModalRoom(targetRoom);
            } else {
              fetch(`/api/rooms/${roomId}`)
                .then(r => r.json())
                .then(data => {
                  if (data && !data.error) setJoinModalRoom(data);
                })
                .catch(() => {});
            }
          }
          setJoinModalError('invalid_password');
        } else if (joinModalRoom) {
          setJoinModalError(rawError);
        } else {
          if (rawError === 'room_not_found') {
            addNotification('Room Not Found', 'This watch party is no longer active or the invite link has expired.', 'warning');
          } else if (rawError === 'room_full') {
            addNotification('Room Full', 'This watch party has reached its maximum participant capacity.', 'warning');
          } else if (rawError === 'server_error') {
            addNotification('Server Error', 'Failed to connect to the watch party due to a server network issue.', 'warning');
          } else {
            addNotification('Failed to Join', rawError, 'warning');
          }
        }
      }
    });
  };

  // Leave Watch Party
  const handleLeaveRoom = () => {
    if (activeRoom) {
      socketRef.current.emit('room:leave', { roomId: activeRoom.id });
      setActiveRoom(null);
      setTab('explore');
      window.history.replaceState({}, '', window.location.pathname);
      addNotification('Left Room', 'You left the watch party session', 'info');
    }
  };

  // Playback Control Sync
  const handleControlPlayback = (action: 'play' | 'pause' | 'seek' | 'rateChange', currentTime: number, playbackRate?: number) => {
    if (!activeRoom) return;
    socketRef.current.emit('playback:control', {
      roomId: activeRoom.id,
      action,
      currentTime,
      playbackRate
    });
  };

  // Send Chat Message
  const handleSendMessage = (text: string, type?: 'message' | 'reaction' | 'gif', reactionEmoji?: string) => {
    if (!activeRoom) return;
    socketRef.current.emit('chat:send', {
      roomId: activeRoom.id,
      text,
      type,
      reactionEmoji
    });
  };

  // Trigger Floating Emoji Reaction
  const handleTriggerFloatingReaction = (emoji: string) => {
    if (!activeRoom) return;
    socketRef.current.emit('chat:floating-reaction', {
      roomId: activeRoom.id,
      emoji
    });
  };

  // Voice State Toggle
  const handleToggleVoiceState = (isMuted: boolean, isDeafened: boolean) => {
    if (!activeRoom) return;
    socketRef.current.emit('voice:toggle-state', {
      roomId: activeRoom.id,
      isMuted,
      isDeafened
    });
  };

  // Transfer Host
  const handleTransferHost = (newHostId: string) => {
    if (!activeRoom) return;
    socketRef.current.emit('host:transfer', {
      roomId: activeRoom.id,
      newHostId
    });
  };

  // Host Change Media
  const handleChangeMedia = (media: Room['media']) => {
    if (!activeRoom) return;
    socketRef.current.emit('room:update-media', {
      roomId: activeRoom.id,
      media
    });
  };

  // Admin Terminate Room
  const handleCloseRoom = (roomId: string) => {
    if (activeRoom && activeRoom.id === roomId) {
      handleLeaveRoom();
    }
    setRooms(prev => prev.filter(r => r.id !== roomId));
    addNotification('Admin Action', 'Room terminated by administrator', 'warning');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setTab={setTab}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenCreateRoom={() => setShowCreateRoomModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        activeRoomId={activeRoom?.id || null}
        notifications={notifications}
        latency={latency}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {currentTab === 'explore' && (
          <DashboardView
            rooms={rooms}
            onJoinRoom={(room) => initiateJoinRoom(room)}
            onCreateRoom={() => setShowCreateRoomModal(true)}
            latency={latency}
          />
        )}

        {currentTab === 'room' && activeRoom && (
          <WatchPartyRoom
            room={activeRoom}
            currentUser={user}
            onLeaveRoom={handleLeaveRoom}
            onControlPlayback={handleControlPlayback}
            onSendMessage={handleSendMessage}
            onTriggerFloatingReaction={handleTriggerFloatingReaction}
            floatingReactions={floatingReactions}
            onToggleVoiceState={handleToggleVoiceState}
            onTransferHost={handleTransferHost}
            onChangeMedia={handleChangeMedia}
            syncDrift={syncDrift}
          />
        )}

        {currentTab === 'history' && (
          <WatchHistoryView
            history={user?.watchHistory || []}
            onRejoin={(id) => {
              const r = rooms.find(x => x.id === id);
              performPreflightAndJoin(id, undefined, r);
            }}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            rooms={rooms}
            onCloseRoom={handleCloseRoom}
          />
        )}
      </main>

      {/* Modals & Toasts */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={(u) => {
          setUser(u);
          addNotification('Welcome Back', `Logged in as ${u.name}`, 'success');
        }}
      />

      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onCreateRoom={handleCreateRoom}
        user={user}
      />

      <JoinPasswordModal
        isOpen={!!joinModalRoom}
        onClose={() => {
          setJoinModalRoom(null);
          setJoinModalError(null);
        }}
        room={joinModalRoom}
        onJoin={(roomId, pwd) => performPreflightAndJoin(roomId, pwd, joinModalRoom || undefined)}
        error={joinModalError}
        isSubmitting={isJoiningRoom}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdateUser={(updated) => {
          setUser(updated);
          addNotification('Profile Updated', 'Your profile preferences were saved', 'success');
        }}
        onLogout={() => {
          setUser(null);
          if (activeRoom) handleLeaveRoom();
          addNotification('Logged Out', 'You have been signed out', 'info');
        }}
      />

      <NotificationToast
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <p>© 2026 SyncStream Enterprise Watch Party Platform • Real-Time WebSockets & WebRTC Sync</p>
      </footer>

    </div>
  );
}
