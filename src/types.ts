export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  role: 'user' | 'admin';
  status: 'online' | 'offline' | 'watching';
  watchHistory: WatchHistoryItem[];
  joinedDate: string;
}

export interface Participant {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  joinedAt: string;
  connectionQuality?: 'excellent' | 'good' | 'fair';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  type: 'message' | 'system' | 'reaction' | 'gif';
  reactionEmoji?: string;
  mediaUrl?: string;
}

export interface MediaItem {
  type: 'mp4' | 'youtube' | 'hls' | 'audio';
  url: string;
  title: string;
  duration: number;
  posterUrl?: string;
  description?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  lastUpdated: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  category: 'Movies' | 'Tech & Talks' | 'Anime & Animation' | 'Gaming' | 'Music & Concerts' | 'Personal Uploads';
  isPublic: boolean;
  password?: string;
  passwordHint?: string;
  passwordRequired?: boolean;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  createdAt: string;
  maxParticipants: number;
  media: MediaItem;
  playback: PlaybackState;
  participants: Participant[];
  messages: ChatMessage[];
  tags?: string[];
}

export interface WatchHistoryItem {
  id: string;
  roomId: string;
  roomName: string;
  mediaTitle: string;
  mediaUrl: string;
  watchedAt: string;
  durationSeconds: number;
  hostName: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  xPercent?: number;
}
