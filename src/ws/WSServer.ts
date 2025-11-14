import { colorize } from 'utils/colors.js';
import { WebSocketServer } from 'ws';

export class WSServer {
  start(port: number, startHandler?: () => void) {
    const wss = new WebSocketServer({ port });

    wss.on('connection', () => {
      console.log(colorize('Client connected', 'green'));
    });

    if (startHandler) startHandler();
  }
}
