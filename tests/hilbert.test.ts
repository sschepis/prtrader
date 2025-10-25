import { describe, it, expect } from 'vitest';
import { embed, project, collapse, measure, fuse, shannonEntropy } from '../src/hilbert.js';

const P = [2,3,5,7,11] as const;

describe('Hilbert operators', () => {
  it('embed → normalized amplitudes', () => {
    const h = embed(42, { P: [...P], phi: {} });
    const sum = P.reduce((s, p) => s + h.amps[p], 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });

  it('project keeps only basis B', () => {
    const h = embed(42, { P: [...P], phi: {} });
    const B = [3,5];
    const hp = project(h, B);
    expect(hp.basis).toEqual(B);
    const keys = Object.keys(hp.amps).map(Number).sort((a,b)=>a-b);
    expect(keys).toEqual(B);
  });

  it('collapse reduces entropy toward tau', () => {
    const h = embed(12345, { P: [...P], phi: {} });
    const H0 = shannonEntropy(h);
    const hc = collapse(h, Math.max(0, H0 - 0.5));
    const H1 = shannonEntropy(hc);
    expect(H1).toBeLessThanOrEqual(H0);
  });

  it('measure returns bounded refinement bits', () => {
    const h = embed(999, { P: [...P], phi: {} });
    const m = measure(h, 18);
    expect(m).toBeGreaterThanOrEqual(0);
    expect(m).toBeLessThan(1 << 18);
  });

  it('fuse places refinement bits at 14..31', () => {
    const n0 = 0x3FFFn; // lower 14 bits all ones
    const m = (1 << 18) - 1; // all ones 18-bit
    const fused = fuse(Number(n0), m);
    expect(fused >>> 14).toEqual(m);
    expect((fused & 0x3FFF)).toEqual(0x3FFF);
  });
});
