import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import { validateRoomPassword } from "./server/middleware/auth.js";

const getDirname = () => {
  try {
    if (typeof import.meta !== "undefined" && typeof import.meta.url === "string" && import.meta.url.length > 0) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (_e) {
    // fallback to process.cwd()
  }
  return process.cwd();
};

const appDir = getDirname();

interface Participant {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  joinedAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  type: 'message' | 'system' | 'reaction' | 'gif';
  reactionEmoji?: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  password?: string;
  passwordHint?: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  createdAt: string;
  maxParticipants: number;
  media: {
    type: 'mp4' | 'youtube' | 'hls' | 'audio';
    url: string;
    title: string;
    duration: number;
    posterUrl?: string;
  };
  playback: {
    isPlaying: boolean;
    currentTime: number;
    playbackRate: number;
    lastUpdated: number;
  };
  participants: Participant[];
  messages: ChatMessage[];
}

// In-memory store for active rooms
const rooms: Map<string, Room> = new Map();

// Seed initial public room so the dashboard is vibrant immediately
const seedInitialRooms = () => {
  if (rooms.size === 0) {
    const demoRoom: Room = {
      id: "demo-cyber-lounge",
      name: "🍿 Sci-Fi Cinema Night: Tears of Steel",
      description: "Community watch party streaming open-source cinematic masterpiece Tears of Steel in 4K HDR.",
      category: "Movies",
      isPublic: true,
      hostId: "system-host-1",
      hostName: "SyncStream Bot",
      hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      maxParticipants: 50,
      media: {
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        title: "Tears of Steel (4K Open Movie)",
        duration: 734,
        posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"
      },
      playback: {
        isPlaying: true,
        currentTime: 42,
        playbackRate: 1.0,
        lastUpdated: Date.now()
      },
      participants: [
        {
          id: "system-host-1",
          socketId: "bot-socket-1",
          name: "SyncStream Bot",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          isHost: true,
          isMuted: false,
          isDeafened: false,
          joinedAt: new Date().toISOString()
        },
        {
          id: "bot-user-2",
          socketId: "bot-socket-2",
          name: "Elena Rostova",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          isHost: false,
          isMuted: true,
          isDeafened: false,
          joinedAt: new Date().toISOString()
        }
      ],
      messages: [
        {
          id: "msg-1",
          senderId: "system-host-1",
          senderName: "SyncStream Bot",
          senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          text: "Welcome everyone to SyncStream! Audio and video are perfectly synchronized.",
          timestamp: Date.now() - 300000,
          type: "system"
        },
        {
          id: "msg-2",
          senderId: "bot-user-2",
          senderName: "Elena Rostova",
          senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          text: "The audio sync precision here is amazing! 🚀",
          timestamp: Date.now() - 120000,
          type: "message"
        }
      ]
    };
    rooms.set(demoRoom.id, demoRoom);
  }
};

seedInitialRooms();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get active public rooms
  app.get("/api/rooms", (_req, res) => {
    const roomList = Array.from(rooms.values()).map(r => ({
      ...r,
      passwordRequired: !!r.password,
      passwordHint: r.passwordHint || undefined,
      password: undefined // Never send actual password to list
    }));
    res.json(roomList);
  });

  // Pre-flight room validation endpoint
  const handlePreflight = (req: express.Request, res: express.Response) => {
    const roomId = req.params.id;
    const password = (req.body?.password || req.query?.password || "") as string;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "room_not_found",
        message: "This watch party room no longer exists or the link is invalid."
      });
    }

    if (room.participants.length >= room.maxParticipants) {
      return res.status(409).json({
        success: false,
        error: "room_full",
        message: "This room has reached its maximum participant capacity."
      });
    }

    const pwdValidation = validateRoomPassword(room.password, password);
    if (!pwdValidation.valid) {
      if (pwdValidation.error === "password_required") {
        return res.status(401).json({
          success: false,
          error: "password_required",
          message: "Password required to join this watch party.",
          passwordRequired: true,
          passwordHint: room.passwordHint || undefined,
          room: {
            ...room,
            passwordRequired: true,
            passwordHint: room.passwordHint || undefined,
            password: undefined
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: "invalid_password",
          message: "Incorrect password. Please verify and try again.",
          passwordRequired: true,
          passwordHint: room.passwordHint || undefined,
          room: {
            ...room,
            passwordRequired: true,
            passwordHint: room.passwordHint || undefined,
            password: undefined
          }
        });
      }
    }

    return res.status(200).json({
      valid: true,
      room: {
        ...room,
        passwordRequired: !!room.password,
        passwordHint: room.passwordHint || undefined,
        password: undefined
      }
    });
  };

  app.post("/api/rooms/:id/preflight", handlePreflight);
  app.get("/api/rooms/:id/preflight", handlePreflight);

  // Admin stats endpoint
  app.get("/api/admin/stats", (_req, res) => {
    let totalParticipants = 0;
    rooms.forEach(r => {
      totalParticipants += r.participants.length;
    });

    res.json({
      totalRooms: rooms.size,
      activeRooms: Array.from(rooms.values()).filter(r => r.participants.length > 0).length,
      connectedUsers: totalParticipants,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    });
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    let currentRoomId: string | null = null;
    let currentUser: Participant | null = null;

    // Create room
    socket.on("room:create", (payload: {
      roomData: Partial<Room>;
      user: { id: string; name: string; avatar: string };
    }, callback) => {
      const roomId = payload.roomData.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const hostParticipant: Participant = {
        id: payload.user.id,
        socketId: socket.id,
        name: payload.user.name,
        avatar: payload.user.avatar,
        isHost: true,
        isMuted: false,
        isDeafened: false,
        joinedAt: new Date().toISOString()
      };

      const newRoom: Room = {
        id: roomId,
        name: payload.roomData.name || "Watch Party",
        description: payload.roomData.description || "Join us for synchronized streaming!",
        category: payload.roomData.category || "Movies",
        isPublic: payload.roomData.isPublic !== false,
        password: payload.roomData.password || "",
        passwordHint: payload.roomData.passwordHint || "",
        hostId: payload.user.id,
        hostName: payload.user.name,
        hostAvatar: payload.user.avatar,
        createdAt: new Date().toISOString(),
        maxParticipants: payload.roomData.maxParticipants || 20,
        media: payload.roomData.media || {
          type: "mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          title: "Big Buck Bunny (HD)",
          duration: 596,
          posterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80"
        },
        playback: {
          isPlaying: false,
          currentTime: 0,
          playbackRate: 1.0,
          lastUpdated: Date.now()
        },
        participants: [hostParticipant],
        messages: [
          {
            id: `sys-${Date.now()}`,
            senderId: "system",
            senderName: "System",
            senderAvatar: "",
            text: `Room created by ${payload.user.name}`,
            timestamp: Date.now(),
            type: "system"
          }
        ]
      };

      rooms.set(roomId, newRoom);
      socket.join(roomId);
      currentRoomId = roomId;
      currentUser = hostParticipant;

      if (typeof callback === "function") {
        callback({ success: true, room: newRoom });
      }

      io.emit("rooms:updated", Array.from(rooms.values()));
    });

    // Join room
    socket.on("room:join", (payload: {
      roomId: string;
      password?: string;
      user: { id: string; name: string; avatar: string };
    }, callback) => {
      const room = rooms.get(payload.roomId);
      if (!room) {
        if (typeof callback === "function") callback({ success: false, error: "room_not_found" });
        return;
      }

      const pwdValidation = validateRoomPassword(room.password, payload.password);
      if (!pwdValidation.valid) {
        if (typeof callback === "function") callback({ success: false, error: "invalid_password" });
        return;
      }

      if (room.participants.length >= room.maxParticipants) {
        if (typeof callback === "function") callback({ success: false, error: "room_full" });
        return;
      }

      // Check if user is already in participants list
      const existingIdx = room.participants.findIndex(p => p.id === payload.user.id);
      const isHost = room.hostId === payload.user.id || existingIdx === 0;

      const participant: Participant = {
        id: payload.user.id,
        socketId: socket.id,
        name: payload.user.name,
        avatar: payload.user.avatar,
        isHost,
        isMuted: false,
        isDeafened: false,
        joinedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        room.participants[existingIdx] = participant;
      } else {
        room.participants.push(participant);
      }

      const joinMessage: ChatMessage = {
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        senderId: "system",
        senderName: "System",
        senderAvatar: "",
        text: `${payload.user.name} joined the watch party! 🎉`,
        timestamp: Date.now(),
        type: "system"
      };

      room.messages.push(joinMessage);

      socket.join(payload.roomId);
      currentRoomId = payload.roomId;
      currentUser = participant;

      // Broadcast join event to everyone in the room
      io.to(payload.roomId).emit("user:joined", {
        participant,
        participants: room.participants,
        systemMessage: joinMessage
      });

      if (typeof callback === "function") {
        callback({ success: true, room });
      }

      io.emit("rooms:updated", Array.from(rooms.values()));
    });

    // Playback control sync (Play, Pause, Seek, Speed) - Shared Control for Host & Friends
    socket.on("playback:control", (payload: {
      roomId: string;
      action: 'play' | 'pause' | 'seek' | 'rateChange';
      currentTime: number;
      playbackRate?: number;
    }) => {
      const room = rooms.get(payload.roomId);
      if (!room) return;

      const participant = room.participants.find(p => p.socketId === socket.id || p.id === currentUser?.id);
      if (!participant) return;

      const isPlaying = payload.action === 'play' ? true : (payload.action === 'pause' ? false : room.playback.isPlaying);
      const playbackRate = payload.playbackRate !== undefined ? payload.playbackRate : room.playback.playbackRate;

      room.playback = {
        isPlaying,
        currentTime: payload.currentTime,
        playbackRate,
        lastUpdated: Date.now()
      };

      // Broadcast playback sync to ALL room members
      io.to(payload.roomId).emit("playback:updated", {
        action: payload.action,
        playback: room.playback,
        initiatedBy: participant.name
      });
    });

    // Time sync ping from active player to keep drift strictly < 0.05s and update server time
    socket.on("playback:ping", (payload: { roomId: string; currentTime: number; isPlaying: boolean }) => {
      const room = rooms.get(payload.roomId);
      if (!room) return;
      const participant = room.participants.find(p => p.socketId === socket.id || p.id === currentUser?.id);
      if (participant) {
        room.playback.currentTime = payload.currentTime;
        room.playback.isPlaying = payload.isPlaying;
        room.playback.lastUpdated = Date.now();

        socket.to(payload.roomId).emit("playback:drift-check", {
          currentTime: payload.currentTime,
          isPlaying: payload.isPlaying,
          serverTimestamp: Date.now()
        });
      }
    });

    // Host updates room media / stream URL
    socket.on("room:update-media", (payload: {
      roomId: string;
      media: Room['media'];
    }) => {
      const room = rooms.get(payload.roomId);
      if (!room) return;

      const participant = room.participants.find(p => p.socketId === socket.id);
      if (!participant || !participant.isHost) return;

      room.media = payload.media;
      room.playback = {
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1.0,
        lastUpdated: Date.now()
      };

      const sysMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: "system",
        senderName: "System",
        senderAvatar: "",
        text: `Host changed stream video to "${payload.media.title}"`,
        timestamp: Date.now(),
        type: "system"
      };

      room.messages.push(sysMessage);

      io.to(payload.roomId).emit("room:media-changed", {
        media: room.media,
        playback: room.playback,
        systemMessage: sysMessage
      });

      io.emit("rooms:updated", Array.from(rooms.values()));
    });

    // Send chat message
    socket.on("chat:send", (payload: {
      roomId: string;
      text: string;
      type?: 'message' | 'reaction' | 'gif';
      reactionEmoji?: string;
    }) => {
      const room = rooms.get(payload.roomId);
      if (!room || !currentUser) return;

      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: payload.text,
        timestamp: Date.now(),
        type: payload.type || "message",
        reactionEmoji: payload.reactionEmoji
      };

      room.messages.push(message);
      // Keep max 200 chat messages
      if (room.messages.length > 200) {
        room.messages.shift();
      }

      io.to(payload.roomId).emit("chat:received", message);
    });

    // Floating reaction trigger (fires instant visual emoji animation across screens)
    socket.on("chat:floating-reaction", (payload: { roomId: string; emoji: string }) => {
      io.to(payload.roomId).emit("chat:floating-reaction", {
        emoji: payload.emoji,
        senderName: currentUser?.name || "Participant",
        id: `react-${Date.now()}-${Math.random()}`
      });
    });

    // Voice chat state toggle (mute/deafen)
    socket.on("voice:toggle-state", (payload: { roomId: string; isMuted: boolean; isDeafened: boolean }) => {
      const room = rooms.get(payload.roomId);
      if (!room || !currentUser) return;

      const p = room.participants.find(part => part.id === currentUser?.id);
      if (p) {
        p.isMuted = payload.isMuted;
        p.isDeafened = payload.isDeafened;

        io.to(payload.roomId).emit("participants:updated", room.participants);
      }
    });

    // Voice signaling (WebRTC offer / answer / ice-candidate)
    socket.on("voice:signal", (payload: { targetSocketId: string; signal: any }) => {
      io.to(payload.targetSocketId).emit("voice:signal", {
        senderSocketId: socket.id,
        senderUser: currentUser,
        signal: payload.signal
      });
    });

    // Transfer host privilege
    socket.on("host:transfer", (payload: { roomId: string; newHostId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room) return;

      const participant = room.participants.find(p => p.socketId === socket.id);
      if (!participant || !participant.isHost) return;

      const newHost = room.participants.find(p => p.id === payload.newHostId);
      if (!newHost) return;

      room.hostId = newHost.id;
      room.hostName = newHost.name;
      room.hostAvatar = newHost.avatar;

      room.participants.forEach(p => {
        p.isHost = p.id === newHost.id;
      });

      const sysMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: "system",
        senderName: "System",
        senderAvatar: "",
        text: `Host privileges transferred to ${newHost.name}`,
        timestamp: Date.now(),
        type: "system"
      };

      room.messages.push(sysMessage);

      io.to(payload.roomId).emit("host:transferred", {
        newHostId: newHost.id,
        newHostName: newHost.name,
        participants: room.participants,
        systemMessage: sysMessage
      });

      io.emit("rooms:updated", Array.from(rooms.values()));
    });

    // Leave room
    socket.on("room:leave", (payload: { roomId: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(payload.roomId || currentRoomId);
      if (room && currentUser) {
        room.participants = room.participants.filter(p => p.socketId !== socket.id);

        const leaveMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          senderId: "system",
          senderName: "System",
          senderAvatar: "",
          text: `${currentUser.name} left the room`,
          timestamp: Date.now(),
          type: "system"
        };
        room.messages.push(leaveMsg);

        // If host left and participants remain, auto transfer host to next participant
        if (room.hostId === currentUser.id && room.participants.length > 0) {
          const nextHost = room.participants[0];
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          room.hostName = nextHost.name;
          room.hostAvatar = nextHost.avatar;

          io.to(room.id).emit("host:transferred", {
            newHostId: nextHost.id,
            newHostName: nextHost.name,
            participants: room.participants,
            systemMessage: {
              id: `sys-host-${Date.now()}`,
              senderId: "system",
              senderName: "System",
              senderAvatar: "",
              text: `${nextHost.name} is now the host.`,
              timestamp: Date.now(),
              type: "system"
            }
          });
        }

        io.to(room.id).emit("user:left", {
          participantId: currentUser.id,
          participants: room.participants,
          systemMessage: leaveMsg
        });

        socket.leave(room.id);
        currentRoomId = null;

        // If empty, cleanup non-demo room after 1 minute
        if (room.participants.length === 0 && room.id !== "demo-cyber-lounge") {
          setTimeout(() => {
            const checkRoom = rooms.get(room.id);
            if (checkRoom && checkRoom.participants.length === 0) {
              rooms.delete(room.id);
              io.emit("rooms:updated", Array.from(rooms.values()));
            }
          }, 60000);
        }

        io.emit("rooms:updated", Array.from(rooms.values()));
      }
    });

    // Disconnect cleanup
    socket.on("disconnect", () => {
      if (currentRoomId && currentUser) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.participants = room.participants.filter(p => p.socketId !== socket.id);

          const leaveMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            senderId: "system",
            senderName: "System",
            senderAvatar: "",
            text: `${currentUser.name} disconnected`,
            timestamp: Date.now(),
            type: "system"
          };
          room.messages.push(leaveMsg);

          if (room.hostId === currentUser.id && room.participants.length > 0) {
            const nextHost = room.participants[0];
            nextHost.isHost = true;
            room.hostId = nextHost.id;
            room.hostName = nextHost.name;
            room.hostAvatar = nextHost.avatar;

            io.to(room.id).emit("host:transferred", {
              newHostId: nextHost.id,
              newHostName: nextHost.name,
              participants: room.participants,
              systemMessage: {
                id: `sys-autohost-${Date.now()}`,
                senderId: "system",
                senderName: "System",
                senderAvatar: "",
                text: `${nextHost.name} is now the host.`,
                timestamp: Date.now(),
                type: "system"
              }
            });
          }

          io.to(room.id).emit("user:left", {
            participantId: currentUser.id,
            participants: room.participants,
            systemMessage: leaveMsg
          });

          io.emit("rooms:updated", Array.from(rooms.values()));
        }
      }
    });
  });

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`SyncStream server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start SyncStream server:", err);
});
