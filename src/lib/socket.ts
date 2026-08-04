import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  public latency: number = 12;

  public connect(): Socket {
    if (!this.socket) {
      const serverUrl = import.meta.env.VITE_API_URL || undefined;
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('SyncStream Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('SyncStream Socket disconnected');
      });

      // Measure round-trip ping
      setInterval(() => {
        if (this.socket && this.socket.connected) {
          const start = Date.now();
          this.socket.emit('ping', () => {
            this.latency = Math.max(1, Math.round((Date.now() - start) / 2));
          });
        }
      }, 5000);
    }
    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
