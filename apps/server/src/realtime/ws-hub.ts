import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { createConsumer } from '../events/kafka.js';
import { KAFKA_TOPICS } from '@virtual-office/shared';

const clients = new Map<string, Set<WebSocket>>();

export function addClient(projectId: string, ws: WebSocket): void {
  if (!clients.has(projectId)) {
    clients.set(projectId, new Set());
  }
  clients.get(projectId)!.add(ws);
}

export function removeClient(projectId: string, ws: WebSocket): void {
  clients.get(projectId)?.delete(ws);
}

export function broadcastToProject(projectId: string, payload: object): void {
  const projectClients = clients.get(projectId);
  if (!projectClients) return;

  const message = JSON.stringify(payload);
  for (const client of projectClients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

export async function registerWebSocketRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws/projects/:projectId', { websocket: true }, (socket, req) => {
    const { projectId } = req.params as { projectId: string };

    addClient(projectId, socket);
    socket.send(JSON.stringify({ type: 'connected', projectId, timestamp: new Date().toISOString() }));

    socket.on('close', () => {
      removeClient(projectId, socket);
    });

    socket.on('error', () => {
      removeClient(projectId, socket);
    });
  });
}

export async function startEventBroadcaster(): Promise<void> {
  const consumer = await createConsumer('virtual-office-ws-broadcaster');

  await consumer.subscribe({
    topics: [
      KAFKA_TOPICS.AGENT_EVENTS,
      KAFKA_TOPICS.TASK_EVENTS,
      KAFKA_TOPICS.WORKFLOW_EVENTS,
      KAFKA_TOPICS.APPROVAL_EVENTS,
      KAFKA_TOPICS.TOOL_EVENTS,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const event = JSON.parse(message.value.toString());
        if (event.projectId) {
          broadcastToProject(event.projectId, event);
        }
      } catch {
        // skip malformed messages
      }
    },
  });

  console.log('[WebSocket] Event broadcaster started');
}
