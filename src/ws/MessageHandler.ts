import { WebSocket } from 'ws';
import { ClientEvent } from '../types/ws-events.js';
import { Router } from './Router.js';
import { WSClient } from '../types/WSClient.js';

export class MessageHandler {
  constructor(private router: Router) {}

  onMessage(client: WSClient, raw: WebSocket.RawData) {
    try {
      const event: ClientEvent = JSON.parse(raw.toString());
      this.router.handle(client, event);
    } catch {
      client.socket.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  }
}
