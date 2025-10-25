import { FeatureFrame, HilbertState, Prime, PhaseVec, UInt32 } from './types.js';
import { embed, project, collapse, measure, fuse } from './hilbert.js';

export interface Observer {
  id: string;
  state: Int32Array;
  base_proposal(x: FeatureFrame): UInt32; // n0
  embed(n0: UInt32, P: Prime[], phi: PhaseVec): HilbertState;
  project(h: HilbertState, B: Prime[]): HilbertState;
  collapse(h: HilbertState, tau: number): HilbertState;
  measure(h: HilbertState): number;
  fuse(n0: UInt32, m: number): UInt32;
}

export class BaseObserver implements Observer {
  constructor(public id: string) { this.state = new Int32Array(8); }
  state: Int32Array;

  base_proposal(x: FeatureFrame): UInt32 {
    // Tiny linear edge → side & size bucket
    const edge = 5 * x.ret_1s + 2 * x.ret_5s - 3 * x.vol_30s;
    let side = 0; // flat
    if (edge > 0.00005) side = 1; // long
    else if (edge < -0.00005) side = 2; // short
    const sizeBucket = Math.min(7, Math.max(0, Math.floor(Math.abs(edge) * 1e5))); // crude mapping
    const ord = (x.regime === 'trend') ? 0 : 1; // market vs post-only
    const tif = 1; // placeholder
    const bracket = 3;

    let n0 = 0 >>> 0;
    n0 |= (side & 0b11);
    n0 |= (sizeBucket & 0b111) << 2;
    n0 |= (ord & 0b11) << 5;
    n0 |= (tif & 0b111) << 7;
    n0 |= (bracket & 0b1111) << 10;
    return n0 >>> 0;
  }

  embed(n0: UInt32, P: Prime[], phi: PhaseVec): HilbertState { return embed(n0, { P, phi }); }
  project(h: HilbertState, B: Prime[]): HilbertState { return project(h, B); }
  collapse(h: HilbertState, tau: number): HilbertState { return collapse(h, tau); }
  measure(h: HilbertState): number { return measure(h); }
  fuse(n0: UInt32, m: number): UInt32 { return fuse(n0, m); }
}
