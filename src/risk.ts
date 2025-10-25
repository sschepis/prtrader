import { FeatureFrame, PositionSnap, RiskLimits } from './types.js';

export class RiskEngine {
  constructor(public limits: RiskLimits) {}

  precheck(n: number, pos: PositionSnap, feat: FeatureFrame): boolean {
    // side bits 0..1: 00 flat, 01 long, 10 short
    const sideBits = n & 0b11;
    const sizeBucket = (n >>> 2) & 0b111; // 0..7
    const unit = 0.002; // BTC per bucket step (example)
    const qty = sizeBucket * unit;
    const notional = qty * (pos ? pos.avg_px : 0);

    if (Math.abs((pos?.qty ?? 0) + (sideBits === 1 ? qty : sideBits === 2 ? -qty : 0)) > this.limits.maxInv) return false;
    if (Math.abs(notional) > this.limits.maxNotional) return false;

    // Simple shock guard: block if regime is shock
    if (feat.regime === 'shock') return false;
    return true;
  }
}
