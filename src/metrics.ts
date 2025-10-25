import { UnixMillis, PhaseVec, Prime } from './types.js';
import { FitnessMetrics } from './fitness.js';

export interface BarMetrics {
  ts: UnixMillis;
  guildId: string;
  pnl: number;
  position: number;
  turnover: number;
  fillRatio: number;
  slippage: number;
  fee: number;
  phiSummary: PhaseSummary;
  hilbertEntropy: number;
  coherence: number;
  fitness: number;
}

export interface PhaseSummary {
  // Circular mean length (measure of phase concentration)
  meanLength: number;
  // Individual phase values per prime
  phases: Record<Prime, number>;
}

export interface EpochMetrics {
  epoch: number;
  startTs: UnixMillis;
  endTs: UnixMillis;
  guildId: string;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  hitRate: number;
  avgAdverseExcursion: number;
  totalPnl: number;
  totalTurnover: number;
  avgLatency: number;
  phiStability: number; // measure of how stable phi was over epoch
}

/**
 * Compute circular mean length of phase vector
 * per design.md section 8: measures phase concentration
 */
export function computePhaseMeanLength(phi: PhaseVec): number {
  const primes = Object.keys(phi).map(Number);
  if (primes.length === 0) return 0;
  
  let sumCos = 0, sumSin = 0;
  for (const p of primes) {
    const angle = 2 * Math.PI * phi[p];
    sumCos += Math.cos(angle);
    sumSin += Math.sin(angle);
  }
  
  const meanCos = sumCos / primes.length;
  const meanSin = sumSin / primes.length;
  
  return Math.sqrt(meanCos * meanCos + meanSin * meanSin);
}

export function summarizePhases(phi: PhaseVec): PhaseSummary {
  return {
    meanLength: computePhaseMeanLength(phi),
    phases: { ...phi }
  };
}

/**
 * Track metrics over time
 */
export class MetricsCollector {
  private barMetrics: BarMetrics[] = [];
  private epochMetrics: EpochMetrics[] = [];
  
  recordBar(metrics: BarMetrics): void {
    this.barMetrics.push(metrics);
  }
  
  recordEpoch(metrics: EpochMetrics): void {
    this.epochMetrics.push(metrics);
  }
  
  getBarMetrics(): BarMetrics[] {
    return this.barMetrics;
  }
  
  getEpochMetrics(): EpochMetrics[] {
    return this.epochMetrics;
  }
  
  /**
   * Compute Sharpe ratio from P&L series
   */
  computeSharpe(pnls: number[], riskFreeRate = 0): number {
    if (pnls.length < 2) return 0;
    
    const mean = pnls.reduce((s, p) => s + p, 0) / pnls.length;
    const variance = pnls.reduce((s, p) => s + (p - mean) ** 2, 0) / (pnls.length - 1);
    const std = Math.sqrt(variance);
    
    if (std === 0) return 0;
    return (mean - riskFreeRate) / std;
  }
  
  /**
   * Compute Sortino ratio (downside deviation only)
   */
  computeSortino(pnls: number[], targetReturn = 0): number {
    if (pnls.length < 2) return 0;
    
    const mean = pnls.reduce((s, p) => s + p, 0) / pnls.length;
    const downside = pnls.filter(p => p < targetReturn);
    
    if (downside.length === 0) return Infinity;
    
    const downsideVariance = downside.reduce((s, p) => s + (p - targetReturn) ** 2, 0) / downside.length;
    const downsideStd = Math.sqrt(downsideVariance);
    
    if (downsideStd === 0) return 0;
    return (mean - targetReturn) / downsideStd;
  }
  
  /**
   * Compute maximum drawdown
   */
  computeMaxDrawdown(pnls: number[]): number {
    let peak = 0;
    let maxDD = 0;
    let cum = 0;
    
    for (const p of pnls) {
      cum += p;
      peak = Math.max(peak, cum);
      const dd = peak - cum;
      maxDD = Math.max(maxDD, dd);
    }
    
    return maxDD;
  }
  
  /**
   * Compute hit rate (fraction of profitable trades)
   */
  computeHitRate(pnls: number[]): number {
    if (pnls.length === 0) return 0;
    const winners = pnls.filter(p => p > 0).length;
    return winners / pnls.length;
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.barMetrics = [];
    this.epochMetrics = [];
  }
}
