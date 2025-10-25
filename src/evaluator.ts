import { FeatureFrame, ObjectiveResult, ProxyResult } from './types.js';

export interface Evaluator {
  proxy(n: number, feat: FeatureFrame): ProxyResult;
  objective(pnlDelta: number, fee: number, invPenalty: number, slippage: number): ObjectiveResult;
}

export class SimpleEvaluator implements Evaluator {
  constructor(private cfg: { edgeThreshold: number; impactK: number; impactBeta: number }) {}

  proxy(n: number, feat: FeatureFrame): ProxyResult {
    // Extract crude edge proxy from features (you can replace with microstructure-aware model)
    const edge = 5 * feat.ret_1s + 2 * feat.ret_5s - 3 * feat.vol_30s;
    // Simple impact guess from magnitude encoded in action (size bucket 0..7 in bits 2..4)
    const sizeBucket = (n >>> 2) & 0b111;
    const qtyRel = (sizeBucket + 1) / 8; // relative to a max
    const impact = this.cfg.impactK * Math.pow(qtyRel, this.cfg.impactBeta);

    const pass = (edge - impact) > this.cfg.edgeThreshold;
    return { pass, edge, impact };
  }

  objective(pnl: number, fee: number, invPenalty: number, slippage: number): ObjectiveResult {
    return { pnl, fee, inventoryPenalty: invPenalty, slippage };
  }
}
