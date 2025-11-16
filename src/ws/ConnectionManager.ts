import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import { WSClient } from '../types/WSClient.js';

export class ConnectionManager {
  private clients = new Map<string, WSClient>();

  addClient(socket: WebSocket): WSClient {
    const client: WSClient = {
      id: randomUUID(),
      socket,
    };
    this.clients.set(client.id, client);
    return client;
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  getClient(id: string) {
    return this.clients.get(id);
  }

  getClientByPlayerId(playerId: string): WSClient | undefined {
    for (const client of this.clients.values()) {
      if (client.playerId === playerId) {
        return client;
      }
    }
    return undefined;
  }

  broadcastToRoom(roomId: string, data: any) {
    const json = JSON.stringify(data);

    for (const client of this.clients.values()) {
      if (client.rooms.has(roomId)) {
        client.socket.send(json);
      }
    }
  }
}
