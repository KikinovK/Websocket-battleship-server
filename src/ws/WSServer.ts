import { WebSocketServer } from 'ws';

import { ConnectionManager } from './ConnectionManager.js';
import { Router } from './Router.js';
import { MessageHandler } from './MessageHandler.js';
import { Database } from '../db/Database.js';

import { colorize } from 'utils/colors.js';

export class WSServer {
  private db = new Database();
  private manager = new ConnectionManager();
  private router = new Router(this.manager, this.db);
  private handler = new MessageHandler(this.router);
  private wss?: WebSocketServer;

  start(port: number, startHandler?: () => void) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      const client = this.manager.addClient(ws);
      console.log(colorize('Client connected ', 'green'), colorize(client.id, 'yellow'));

      ws.on('message', (raw) => {
        console.log(colorize(`Message received ${client.playerId || ''}`, 'green'));
        console.log(colorize(raw.toString(), 'blue'));

        this.handler.onMessage(client, raw);
      });

      ws.on('close', () => {
        this.manager.removeClient(client.id);

        const namePlayer = client.playerId ? this.db.getPlayer(client.playerId)?.name : null;
        if (namePlayer) {
          console.log(colorize('Player disconnected: ', 'cyan'), colorize(namePlayer, 'yellow'));
        }
        console.log(colorize('Client disconnected ', 'green'), colorize(client.id, 'yellow'));
      });
    });

    this.wss.on('listening', () => {});

    if (startHandler) startHandler();
  }

  stop() {
    if (this.wss) {
      this.wss.clients.forEach((ws) => ws.close());
      this.wss.close();
      console.log(colorize('WebSocket server stopped', 'red'));
    }
  }
}
