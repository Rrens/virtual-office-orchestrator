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

  it('sanitizes direct circular dependency T1 -> T2 -> T1 cleanly without throwing', () => {
    const tasks = [
      { id: 'T1', dependencies: ['T2'] },
      { id: 'T2', dependencies: ['T1'] },
    ];

    expect(() => (engine as any).validateDAG(tasks)).not.toThrow();
    // Verify cycle was broken
    const t1HasT2 = tasks.find((t) => t.id === 'T1')?.dependencies.includes('T2');
    const t2HasT1 = tasks.find((t) => t.id === 'T2')?.dependencies.includes('T1');
    expect(t1HasT2 && t2HasT1).toBe(false);
  });

  it('sanitizes indirect multi-step cycle cleanly without throwing', () => {
    const tasks = [
      { id: 'T1', dependencies: ['T3'] },
      { id: 'T2', dependencies: ['T1'] },
      { id: 'T3', dependencies: ['T2'] },
    ];

    expect(() => (engine as any).validateDAG(tasks)).not.toThrow();
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
