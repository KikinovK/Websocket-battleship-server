import { WebSocket } from 'ws';

export interface WSClient {
  id: string;
  socket: WebSocket;
  rooms: Set<string>;
  playerId?: string;
}
