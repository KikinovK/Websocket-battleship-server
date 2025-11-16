import { colorize } from 'utils/colors.js';
import { WSServer } from 'ws/WSServer.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = new WSServer();
server.start(PORT, () => {
  console.log(colorize(`WebSocket server tarted on ws://localhost:${PORT}`, 'green'));
});

process.on('SIGINT', () => server.stop());
process.on('SIGTERM', () => server.stop());
process.on('exit', () => server.stop());

export default {};
