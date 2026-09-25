import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../workflows/engine.js';

describe('WorkflowEngine DAG Validation', () => {
  const engine = new WorkflowEngine();

  it('allows valid acyclic tasks graph', () => {
    const tasks = [
      { id: 'T1', dependencies: [] },
      { id: 'T2', dependencies: ['T1'] },
      { id: 'T3', dependencies: ['T1'] },
      { id: 'T4', dependencies: ['T2', 'T3'] },
    ];

    expect(() => (engine as any).validateDAG(tasks)).not.toThrow();
  });

  it('throws on direct circular dependency T1 -> T2 -> T1', () => {
    const tasks = [
      { id: 'T1', dependencies: ['T2'] },
      { id: 'T2', dependencies: ['T1'] },
    ];

    expect(() => (engine as any).validateDAG(tasks)).toThrow(/Cycle detected/);
  });

  it('throws on indirect multi-step cycle', () => {
    const tasks = [
      { id: 'T1', dependencies: ['T3'] },
      { id: 'T2', dependencies: ['T1'] },
      { id: 'T3', dependencies: ['T2'] },
    ];

    expect(() => (engine as any).validateDAG(tasks)).toThrow(/Cycle detected/);
  });

  it('correctly computes downstream tasks on failure', () => {
    const tasks = [
      { id: 'T1', dependencies: [] },
      { id: 'T2', dependencies: [{ dependsOnTaskId: 'T1' }] },
      { id: 'T3', dependencies: [{ dependsOnTaskId: 'T2' }] },
      { id: 'T4', dependencies: [] },
    ];

    const downstream = (engine as any).getDownstreamTasks('T1', tasks as any);
    expect(downstream).toContain('T2');
    expect(downstream).toContain('T3');
    expect(downstream).not.toContain('T4');
  });
});
