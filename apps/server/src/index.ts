import http from 'node:http';
import { env } from './config/env.js';
import { createApp } from './api/app.js';
import { initRealtime } from './realtime/socket.js';
import { botManager } from './bot/bot-manager.js';
import { logger } from './logging/logger.js';

const app = createApp();
const server = http.createServer(app);

initRealtime(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'server_started');
  void botManager.start();
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

function shutdown(signal: string): void {
  logger.info({ signal }, 'server_stopping');
  server.close(() => process.exit(0));
}
