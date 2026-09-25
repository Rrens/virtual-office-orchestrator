import { describe, it, expect, beforeEach } from 'vitest';
import { GraphifyEngine } from '../graphify/engine.js';

describe('GraphifyEngine', () => {
  let engine: GraphifyEngine;

  beforeEach(() => {
    engine = new GraphifyEngine();
  });

  it('builds knowledge graph from project milestones, agents, and artifacts', () => {
    const result = engine.ingestProjectArtifacts(
      'proj-1',
      'Test POS App',
      'Build modern POS platform',
      [
        {
          id: 'MILESTONE-ENGINEERING',
          department: 'engineering',
          leadRole: 'backend-engineer',
          leadName: 'Zaki',
          directive: 'Build backend APIs and DB schema',
        },
      ],
      [
        {
          id: 'agent-1',
          name: 'Zaki',
          role: 'backend-engineer',
          department: 'engineering',
        },
      ],
      [
        {
          artifactId: 'art-1',
          taskId: 'task-1',
          agentRole: 'backend-engineer',
          path: 'src/api/server.ts',
          content: `
            import express from 'express';
            app.get('/api/products', (req, res) => {});
            app.post('/api/orders', (req, res) => {});
            export async function calculateTotal(items: any[]) { return 100; }
            export interface OrderItem { id: string; price: number; }
          `,
        },
        {
          artifactId: 'art-2',
          taskId: 'task-2',
          agentRole: 'backend-engineer',
          path: 'prisma/schema.prisma',
          content: `
            model Product {
              id String @id
              name String
              price Float
            }
          `,
        },
      ]
    );

    expect(result.nodes.length).toBeGreaterThan(5);
    expect(result.edges.length).toBeGreaterThan(5);

    // Verify API routes were extracted
    const routes = engine.findNodesByType('api_route');
    expect(routes.length).toBe(2);
    expect(routes.some((r) => r.label === 'GET /api/products')).toBe(true);
    expect(routes.some((r) => r.label === 'POST /api/orders')).toBe(true);

    // Verify DB table and columns were extracted
    const tables = engine.findNodesByType('database_table');
    expect(tables.length).toBe(1);
    expect(tables[0].label).toBe('Product');

    const columns = engine.findNodesByType('database_column');
    expect(columns.length).toBe(3);

    // Verify functions and interfaces
    const fns = engine.findNodesByType('function');
    expect(fns.some((f) => f.label === 'calculateTotal')).toBe(true);

    const ifaces = engine.findNodesByType('interface');
    expect(ifaces.some((i) => i.label === 'OrderItem')).toBe(true);
  });
});
