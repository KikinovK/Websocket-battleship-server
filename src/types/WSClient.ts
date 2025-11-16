import { WebSocket } from 'ws';

export interface WSClient {
  id: string;
  socket: WebSocket;
  playerId?: string;
}
