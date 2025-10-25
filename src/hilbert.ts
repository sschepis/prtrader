import { HilbertState, Prime, PhaseVec, UInt32 } from './types.js';
import { hashFloatArray } from './utils/hash.js';

export interface EmbedConfig { P: Prime[]; phi: PhaseVec }

export function embed(n0: UInt32, cfg: EmbedConfig): HilbertState {
  const { P, phi } = cfg;
  const amps: Record<Prime, number> = {} as any;
  const phases: Record<Prime, number> = {} as any;
  for (const p of P) {
    const r = n0 % p; // residue
    const a = 1 - (r / p); // simple amplitude; higher when residue small
    amps[p] = Math.max(0, a);
    const ph = 2 * Math.PI * (r / p) + 2 * Math.PI * ((phi[p] ?? 0) % 1);
    phases[p] = ph;
  }
  const basis = [...P];
  return normalize({ amps, phases, basis });
}

export function normalize(h: HilbertState): HilbertState {
  const sum = h.basis.reduce((s, p) => s + (h.amps[p] ?? 0), 0);
  if (sum <= 0) return h;
  for (const p of h.basis) h.amps[p] = (h.amps[p] ?? 0) / sum;
  return h;
}

export function project(h: HilbertState, B: Prime[]): HilbertState {
  const amps: Record<Prime, number> = {} as any;
  const phases: Record<Prime, number> = {} as any;
  for (const p of B) {
    amps[p] = h.amps[p] ?? 0;
    phases[p] = h.phases[p] ?? 0;
  }
  return normalize({ amps, phases, basis: [...B] });
}

export function shannonEntropy(h: HilbertState): number {
  let H = 0;
  for (const p of h.basis) {
    const w = h.amps[p] ?? 0;
    if (w > 0) H -= w * Math.log2(w);
  }
  return H;
}

export function collapse(h: HilbertState, tau: number, gamma = 0.2): HilbertState {
  // Soft top-k prune until H <= tau
  const entries = h.basis.map(p => ({ p, a: h.amps[p] ?? 0 })).sort((a, b) => b.a - a.a);
  let keep = entries.length;
  const clone: HilbertState = { amps: { ...h.amps }, phases: { ...h.phases }, basis: [...h.basis] };

  const H0 = shannonEntropy(clone);
  if (H0 <= tau) return clone;

  // Try reducing by shrinking low-amp channels
  while (keep > 1) {
    for (let i = keep; i < entries.length; i++) {
      const p = entries[i].p;
      clone.amps[p] = (clone.amps[p] ?? 0) * gamma; // attenuate tail
    }
    normalize(clone);
    const H = shannonEntropy(clone);
    if (H <= tau) break;
    keep--;
  }
  return clone;
}

export function measure(h: HilbertState, refinementBits = 18): number {
  // Deterministic mixer from (a_p, phase_p)
  const v: number[] = [];
  for (const p of h.basis) {
    const a = h.amps[p] ?? 0;
    const ph = h.phases[p] ?? 0;
    v.push(a * Math.cos(ph));
  }
  for (const p of h.basis) {
    const a = h.amps[p] ?? 0;
    const ph = h.phases[p] ?? 0;
    v.push(a * Math.sin(ph));
  }
  const h32 = hashFloatArray(v) >>> 0;
  const mask = (1 << refinementBits) - 1; // 18 bits → 0x3FFFF
  return h32 & mask;
}

export function fuse(n0: UInt32, m: number): UInt32 {
  // set bits 14..31 to m
  const cleared = n0 & 0x00003FFF; // keep lower 14 bits
  const placed = (m & 0x3FFFF) << 14;
  return (cleared | placed) >>> 0;
}
