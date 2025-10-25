import { HilbertState, PhaseVec, Prime } from './types.js';
import { shannonEntropy } from './hilbert.js';

export interface FitnessMetrics {
  LZ2: number;        // mean squared LZ score
  maxLZ: number;      // best LZ score
  coherence: number;  // guild coherence (Jaccard overlap)
  Hint: number;       // internal entropy (mean)
}

export interface FitnessWeights {
  lambda1: number;  // weight for LZ²
  lambda2: number;  // weight for max LZ
  lambda3: number;  // weight for coherence
  lambda4: number;  // weight for (Hmax - Hint)
  Hmax: number;     // max entropy reference
}

export const DEFAULT_FITNESS_WEIGHTS: FitnessWeights = {
  lambda1: 1.0,
  lambda2: 2.0,
  lambda3: 0.5,
  lambda4: 0.3,
  Hmax: 4.0
};

/**
 * Compute fitness score per design.md section 5.2:
 * F = λ1*LZ² + λ2*max(LZ) + λ3*coh + λ4*(Hmax - Hint)
 */
export function computeFitness(metrics: FitnessMetrics, weights: FitnessWeights = DEFAULT_FITNESS_WEIGHTS): number {
  const { LZ2, maxLZ, coherence, Hint } = metrics;
  const { lambda1, lambda2, lambda3, lambda4, Hmax } = weights;
  
  return (
    lambda1 * LZ2 +
    lambda2 * maxLZ +
    lambda3 * coherence +
    lambda4 * (Hmax - Hint)
  );
}

/**
 * Compute LZ proxy score from objective results
 * LZ measures "goodness" - higher is better
 * For trading: positive P&L, low slippage, low fees
 */
export function computeLZ(pnl: number, fee: number, slippage: number): number {
  // Simple proxy: net P&L adjusted for costs
  // Normalize to [0,1] range approximately
  const netPnl = pnl - fee - Math.abs(slippage);
  // Use sigmoid-like transform to bound it
  return 1 / (1 + Math.exp(-netPnl * 10));
}

/**
 * Calculate Jaccard overlap (coherence) of top-k amplitude supports
 * per design.md section 5.1
 */
export function coherence(states: HilbertState[], topK = 3): number {
  if (states.length < 2) return 1.0;
  
  // Get top-k primes by amplitude for each state
  const topSets = states.map(h => {
    const sorted = h.basis
      .map(p => ({ p, a: h.amps[p] ?? 0 }))
      .sort((a, b) => b.a - a.a)
      .slice(0, topK)
      .map(x => x.p);
    return new Set(sorted);
  });
  
  // Compute pairwise Jaccard and average
  let totalOverlap = 0;
  let pairs = 0;
  
  for (let i = 0; i < topSets.length; i++) {
    for (let j = i + 1; j < topSets.length; j++) {
      const setA = topSets[i];
      const setB = topSets[j];
      
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;
      totalOverlap += jaccard;
      pairs++;
    }
  }
  
  return pairs > 0 ? totalOverlap / pairs : 0;
}

/**
 * Compute mean internal entropy across states
 */
export function meanInternalEntropy(states: HilbertState[]): number {
  if (states.length === 0) return 0;
  const sum = states.reduce((s, h) => s + shannonEntropy(h), 0);
  return sum / states.length;
}

/**
 * Track per-observer evaluation metrics
 */
export interface ObserverEval {
  observerId: string;
  n: number;              // action taken
  hilbertState: HilbertState;
  lzScore: number;        // LZ for this evaluation
  timestamp: number;
}

/**
 * Aggregate evaluations to compute guild fitness metrics
 */
export function aggregateFitness(evals: ObserverEval[]): FitnessMetrics {
  if (evals.length === 0) {
    return { LZ2: 0, maxLZ: 0, coherence: 0, Hint: 0 };
  }
  
  const lzScores = evals.map(e => e.lzScore);
  const states = evals.map(e => e.hilbertState);
  
  const LZ2 = lzScores.reduce((s, lz) => s + lz * lz, 0) / lzScores.length;
  const maxLZ = Math.max(...lzScores);
  const coh = coherence(states);
  const Hint = meanInternalEntropy(states);
  
  return { LZ2, maxLZ, coherence: coh, Hint };
}
