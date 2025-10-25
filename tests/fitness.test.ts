import { describe, it, expect } from 'vitest';
import { computeLZ, coherence, meanInternalEntropy, aggregateFitness, computeFitness } from '../src/fitness.js';
import { HilbertState } from '../src/types.js';

describe('Fitness calculations', () => {
  it('computeLZ returns value in [0,1] range', () => {
    const lz1 = computeLZ(10, 1, 0.5); // positive P&L
    const lz2 = computeLZ(-10, 1, 0.5); // negative P&L
    
    expect(lz1).toBeGreaterThan(0.5);
    expect(lz1).toBeLessThanOrEqual(1);
    expect(lz2).toBeLessThan(0.5);
    expect(lz2).toBeGreaterThanOrEqual(0);
  });

  it('coherence computes Jaccard overlap correctly', () => {
    const h1: HilbertState = {
      amps: { 2: 0.5, 3: 0.3, 5: 0.2 },
      phases: { 2: 0, 3: 0, 5: 0 },
      basis: [2, 3, 5]
    };
    
    const h2: HilbertState = {
      amps: { 2: 0.4, 3: 0.4, 5: 0.2 },
      phases: { 2: 0, 3: 0, 5: 0 },
      basis: [2, 3, 5]
    };
    
    // Same top-k should give high coherence
    const coh = coherence([h1, h2], 2);
    expect(coh).toBeGreaterThan(0);
    expect(coh).toBeLessThanOrEqual(1);
  });

  it('meanInternalEntropy computes average correctly', () => {
    const h1: HilbertState = {
      amps: { 2: 0.5, 3: 0.5 },
      phases: { 2: 0, 3: 0 },
      basis: [2, 3]
    };
    
    const h2: HilbertState = {
      amps: { 2: 1.0 },
      phases: { 2: 0 },
      basis: [2]
    };
    
    const meanH = meanInternalEntropy([h1, h2]);
    expect(meanH).toBeGreaterThanOrEqual(0);
    // h1 has entropy 1.0 (uniform over 2 states), h2 has entropy 0 (pure state)
    expect(meanH).toBeCloseTo(0.5, 0);
  });

  it('aggregateFitness combines metrics correctly', () => {
    const evals = [
      {
        observerId: 'obs1',
        n: 123,
        hilbertState: {
          amps: { 2: 0.6, 3: 0.4 },
          phases: { 2: 0, 3: 0 },
          basis: [2, 3]
        },
        lzScore: 0.8,
        timestamp: 1000
      },
      {
        observerId: 'obs2',
        n: 456,
        hilbertState: {
          amps: { 2: 0.7, 3: 0.3 },
          phases: { 2: 0, 3: 0 },
          basis: [2, 3]
        },
        lzScore: 0.6,
        timestamp: 1000
      }
    ];
    
    const metrics = aggregateFitness(evals);
    
    expect(metrics.LZ2).toBeGreaterThan(0);
    expect(metrics.maxLZ).toBe(0.8);
    expect(metrics.coherence).toBeGreaterThanOrEqual(0);
    expect(metrics.Hint).toBeGreaterThanOrEqual(0);
  });

  it('computeFitness produces weighted score', () => {
    const metrics = {
      LZ2: 0.5,
      maxLZ: 0.8,
      coherence: 0.6,
      Hint: 1.5
    };
    
    const fitness = computeFitness(metrics);
    expect(fitness).toBeGreaterThan(0);
  });
});
