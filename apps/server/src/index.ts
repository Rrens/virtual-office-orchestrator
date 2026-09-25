import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { prisma } from './db.js';
import { registerRoutes } from './api/routes.js';
import { registerAllTools } from './tools/implementations/index.js';
import { startTaskConsumer } from './workflows/task-consumer.js';
import { registerWebSocketRoutes, startEventBroadcaster } from './realtime/ws-hub.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

await app.register(websocket);

await app.register(swagger, {
  openapi: {
    info: {
      title: 'AI Virtual Office API',
      version: '1.0.0',
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
await registerRoutes(app);

// WebSocket real-time routes
await registerWebSocketRoutes(app);

// Initialize tools
registerAllTools();

// Start Kafka task consumer & event broadcaster (non-blocking)
startTaskConsumer().catch((err) => {
  app.log.warn(`[Kafka] Could not connect task consumer: ${err.message}`);
});

startEventBroadcaster().catch((err) => {
  app.log.warn(`[Kafka] Could not connect event broadcaster: ${err.message}`);
});

// Graceful shutdown
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening on ${address}`);
});
