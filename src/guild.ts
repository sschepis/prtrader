import { FeatureFrame, PhaseVec, Prime, UInt32 } from './types.js';
import { BaseObserver, Observer } from './observer.js';

export interface Guild {
  id: string;
  basis: Prime[];            // B ⊆ P
  phi: PhaseVec;             // shared phase vector
  observers: Observer[];
}

export function createGuild(id: string, basis: Prime[], obsCount: number): Guild {
  const phi: PhaseVec = {};
  for (const p of basis) phi[p] = 0;
  const observers: Observer[] = Array.from({ length: obsCount }, (_, i) => new BaseObserver(`${id}-obs${i}`));
  return { id, basis, phi, observers };
}

export function residues(n: UInt32, P: Prime[]): Record<Prime, number> {
  const r: Record<Prime, number> = {} as any;
  for (const p of P) r[p] = (n % p) / p; // normalized residue
  return r;
}

export function emaPhaseUpdate(phi: PhaseVec, res: Record<Prime, number>, alpha: number): PhaseVec {
  const out: PhaseVec = { ...phi };
  for (const p in res) {
    const pp = Number(p) as Prime;
    const v = res[pp];
    out[pp] = (1 - alpha) * (phi[pp] ?? 0) + alpha * (v % 1);
  }
  return out;
}

export function guildStep(guild: Guild, x: FeatureFrame, P: Prime[], tau: number) {
  // return best (n, score) for this tick (score here is just |edge|-like placeholder)
  let best: { n: UInt32; score: number } | null = null;
  for (const obs of guild.observers) {
    const n0 = obs.base_proposal(x);
    const Ψ1 = obs.embed(n0, P, guild.phi);
    const Ψ2 = obs.project(Ψ1, guild.basis);
    const Ψ3 = obs.collapse(Ψ2, tau);
    const m  = obs.measure(Ψ3);
    const n  = obs.fuse(n0, m);
    // placeholder score: prefer more decisive actions (higher refinement)
    const score = (m & 0x3FFFF) / 0x3FFFF;
    if (!best || score > best.score) best = { n, score };
  }
  return best!;
}
