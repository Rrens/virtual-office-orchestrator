import { describe, it, expect } from 'vitest';
import { ModelRouter } from '../models/router.js';

describe('ModelRouter', () => {
  const router = new ModelRouter();

  it('selects tier3_cloud for high-risk roles', () => {
    expect(router.selectTier('security-engineer', 'low')).toBe('tier3_cloud');
    expect(router.selectTier('devops', 'low')).toBe('tier3_cloud');
    expect(router.selectTier('penetration-tester', 'medium')).toBe('tier3_cloud');
    expect(router.selectTier('orchestrator', 'low')).toBe('tier3_cloud');
  });

  it('selects tier by complexity for standard roles', () => {
    expect(router.selectTier('backend-engineer', 'low')).toBe('tier1_ollama');
    expect(router.selectTier('backend-engineer', 'medium')).toBe('tier2_9router');
    expect(router.selectTier('backend-engineer', 'high')).toBe('tier3_cloud');
  });

  it('defaults to medium tier when complexity omitted', () => {
    expect(router.selectTier('frontend-engineer')).toBe('tier2_9router');
  });
});
