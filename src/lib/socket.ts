import { io, Socket } from 'socket.io-client';

export interface RoomJoinPayload {
  roomId: string;
  password?: string;
  user: { id: string; name: string; avatar: string };
}

export type RejoinCallback = (room: any) => void;
export type ConnectionStateCallback = (isConnected: boolean) => void;
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
export type ConnectionStatusCallback = (status: ConnectionStatus, attempt: number) => void;

class SocketService {
  private socket: Socket | null = null;
  public latency: number = 12;
  private activeRoomPayload: RoomJoinPayload | null = null;
  private rejoinListeners: Set<RejoinCallback> = new Set();
  private connectionListeners: Set<ConnectionStateCallback> = new Set();
  private statusListeners: Set<ConnectionStatusCallback> = new Set();
  private isConnectedState: boolean = false;
  private currentStatus: ConnectionStatus = 'connected';
  private reconnectAttempt: number = 0;
  private pingIntervalId: any = null;

  public connect(): Socket {
    if (!this.socket) {
      const serverUrl = import.meta.env.VITE_API_URL || undefined;
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('SyncStream Socket connected:', this.socket?.id);
        this.isConnectedState = true;
        this.currentStatus = 'connected';
        this.reconnectAttempt = 0;
        this.notifyConnectionState(true);
        this.notifyStatusChange('connected', 0);

        // Auto re-join active room if connection was interrupted
        if (this.activeRoomPayload) {
          console.log(`[SocketService] Connection restored. Auto-rejoining active watch party room ${this.activeRoomPayload.roomId}...`);
          this.rejoinActiveRoom();
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('SyncStream Socket disconnected:', reason);
        this.isConnectedState = false;
        this.currentStatus = 'reconnecting';
        this.notifyConnectionState(false);
        this.notifyStatusChange('reconnecting', this.reconnectAttempt);
      });

      this.socket.io.on('reconnect_attempt', (attempt) => {
        console.log(`[SocketService] Connection attempt #${attempt}...`);
        this.reconnectAttempt = attempt;
        this.currentStatus = 'reconnecting';
        this.notifyStatusChange('reconnecting', attempt);
      });

      this.socket.io.on('reconnect', (attempt) => {
        console.log(`[SocketService] Socket reconnected after ${attempt} attempts`);
        this.isConnectedState = true;
        this.currentStatus = 'connected';
        this.reconnectAttempt = 0;
        this.notifyConnectionState(true);
        this.notifyStatusChange('connected', 0);
      });

      this.socket.io.on('reconnect_failed', () => {
        console.warn(`[SocketService] Socket reconnection failed.`);
        this.currentStatus = 'disconnected';
        this.notifyStatusChange('disconnected', this.reconnectAttempt);
      });

      // Measure round-trip ping
      if (!this.pingIntervalId) {
        this.pingIntervalId = setInterval(() => {
          if (this.socket && this.socket.connected) {
            const start = Date.now();
            this.socket.emit('ping', () => {
              this.latency = Math.max(1, Math.round((Date.now() - start) / 2));
            });
          }
        }, 4000);
      }
    }
    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  public setActiveRoom(payload: RoomJoinPayload | null) {
    this.activeRoomPayload = payload;
  }

  public getActiveRoom(): RoomJoinPayload | null {
    return this.activeRoomPayload;
  }

  public joinRoom(
    payload: RoomJoinPayload,
    callback?: (response: { success: boolean; room?: any; error?: string }) => void
  ) {
    this.activeRoomPayload = payload;
    const socket = this.getSocket();
    socket.emit('room:join', payload, (res: { success: boolean; room?: any; error?: string }) => {
      if (res && res.success && res.room) {
        this.activeRoomPayload = payload;
      }
      if (callback) callback(res);
    });
  }

  public rejoinActiveRoom(callback?: (response: { success: boolean; room?: any; error?: string }) => void) {
    if (!this.activeRoomPayload || !this.socket || !this.socket.connected) return;

    const payload = this.activeRoomPayload;
    this.socket.emit('room:join', payload, (res: { success: boolean; room?: any; error?: string }) => {
      if (res && res.success && res.room) {
        console.log(`[SocketService] Rejoined room ${payload.roomId} successfully. Restoring playback state...`);
        this.rejoinListeners.forEach(listener => {
          try {
            listener(res.room);
          } catch (err) {
            console.error('Error in rejoin listener:', err);
          }
        });
      } else {
        console.warn(`[SocketService] Auto-rejoin for room ${payload.roomId} returned error:`, res?.error);
      }
      if (callback) callback(res);
    });
  }

  public leaveRoom() {
    if (this.socket && this.activeRoomPayload) {
      this.socket.emit('room:leave', { roomId: this.activeRoomPayload.roomId });
    }
    this.activeRoomPayload = null;
  }

  public onRejoin(callback: RejoinCallback): () => void {
    this.rejoinListeners.add(callback);
    return () => {
      this.rejoinListeners.delete(callback);
    };
  }

  public onConnectionChange(callback: ConnectionStateCallback): () => void {
    this.connectionListeners.add(callback);
    callback(this.isConnectedState);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyConnectionState(isConnected: boolean) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    });
  }

  public disconnect() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnectedState = false;
    this.activeRoomPayload = null;
  }
}

export const socketService = new SocketService();

