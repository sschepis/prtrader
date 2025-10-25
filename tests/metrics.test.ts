import { describe, it, expect } from 'vitest';
import { MetricsCollector, computePhaseMeanLength, summarizePhases } from '../src/metrics.js';

describe('Metrics collection', () => {
  it('computePhaseMeanLength measures phase concentration', () => {
    // Uniform phases (low concentration)
    const phi1 = { 2: 0.0, 3: 0.25, 5: 0.5, 7: 0.75 };
    const len1 = computePhaseMeanLength(phi1);
    
    // All same phase (high concentration)
    const phi2 = { 2: 0.0, 3: 0.0, 5: 0.0, 7: 0.0 };
    const len2 = computePhaseMeanLength(phi2);
    
    expect(len1).toBeGreaterThanOrEqual(0);
    expect(len1).toBeLessThanOrEqual(1);
    expect(len2).toBeCloseTo(1.0, 1); // should be near 1
  });

  it('summarizePhases includes mean length and phases', () => {
    const phi = { 2: 0.1, 3: 0.2, 5: 0.3 };
    const summary = summarizePhases(phi);
    
    expect(summary.meanLength).toBeGreaterThanOrEqual(0);
    expect(summary.phases).toEqual(phi);
  });

  it('MetricsCollector stores and retrieves bar metrics', () => {
    const collector = new MetricsCollector();
    
    const metric = {
      ts: 1000,
      guildId: 'g1',
      pnl: 10.5,
      position: 0.01,
      turnover: 5,
      fillRatio: 0.8,
      slippage: 0.1,
      fee: 0.2,
      phiSummary: { meanLength: 0.9, phases: { 2: 0.5 } },
      hilbertEntropy: 1.2,
      coherence: 0.7,
      fitness: 5.5
    };
    
    collector.recordBar(metric);
    const metrics = collector.getBarMetrics();
    
    expect(metrics.length).toBe(1);
    expect(metrics[0]).toEqual(metric);
  });

  it('computeSharpe calculates ratio correctly', () => {
    const collector = new MetricsCollector();
    const pnls = [1, 2, 3, 4, 5];
    
    const sharpe = collector.computeSharpe(pnls);
    expect(sharpe).toBeGreaterThan(0);
  });

  it('computeMaxDrawdown finds largest drawdown', () => {
    const collector = new MetricsCollector();
    const pnls = [10, -5, -3, 8, -12]; // cum: 10, 5, 2, 10, -2
    
    const maxDD = collector.computeMaxDrawdown(pnls);
    expect(maxDD).toBe(12); // from peak 10 to -2
  });

  it('computeHitRate calculates win percentage', () => {
    const collector = new MetricsCollector();
    const pnls = [1, -2, 3, -1, 5]; // 3 winners out of 5
    
    const hitRate = collector.computeHitRate(pnls);
    expect(hitRate).toBeCloseTo(0.6, 2);
  });
});
