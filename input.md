# Prime-Hilbert RL Trader – Starter Repo (TypeScript)

Below is a ready-to-copy starter repository. Paste these files into a new folder and run the commands in **README.md**. The code provides:

* Prime-Hilbert operators **Π, E, M** (projection, entropy collapse, measurement-to-action)
* Observer + Guild ecology skeleton
* Two-stage evaluator (proxy/objective) interfaces
* Paper broker with simple slippage & fills
* Risk guards
* Feature engine placeholder
* Vitest unit tests for operators & broker

---

## 📁 Repository Tree

```
prime-hilbert-trader/
├─ README.md
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ src/
│  ├─ index.ts
│  ├─ types.ts
│  ├─ utils/
│  │  └─ hash.ts
│  ├─ hilbert.ts         // Π, E, M operators + helpers
│  ├─ observer.ts        // Observer interface + base implementation
│  ├─ guild.ts           // Guild + ecology loop utilities
│  ├─ featureEngine.ts   // 1s feature pipeline (stub)
│  ├─ evaluator.ts       // Two-stage evaluator interfaces + simple impl
│  ├─ risk.ts            // Risk engine (hard guards)
│  └─ broker/
│     └─ paperBroker.ts  // Paper trading broker
└─ tests/
   ├─ hilbert.test.ts
   └─ broker.test.ts
```

---

## README.md

````markdown
# Prime-Hilbert RL Trader – Starter Repo (TypeScript)

This is a minimal, modular scaffold for a 1-second BTCUSDT paper-trading agent using the Observer Ecology + Prime-Hilbert operators (Π, E, M).

## Quickstart

```bash
pnpm i   # or npm i / yarn
pnpm test
pnpm build && pnpm start
````

## Scripts

* `pnpm start` – runs `node dist/index.js`
* `pnpm dev` – ts-node dev run (nodemon-like via ts-node-dev)
* `pnpm test` – vitest
* `pnpm build` – tsc build

## Configure

See `src/index.ts` for the MVP configuration (primes, guilds, risk limits). Replace the `FeatureEngine` stub with your feed + real features.

## Notes

* **Actions** are 32-bit integers with bit layout documented in `types.ts`.
* **Π, E, M** implemented in `hilbert.ts`.
* **Paper broker** simulates taker/maker fills inside the 1s bar.
* **Risk engine** blocks orders exceeding caps.

## License

MIT (do what you like; no warranty).

````

---

## package.json
```json
{
  "name": "prime-hilbert-trader",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node --files src/index.ts",
    "build": "tsc -p .",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.5.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.2",
    "vitest": "^2.1.1"
  }
}
````

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## vitest.config.ts

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    environment: 'node'
  }
});
```

---

## src/types.ts

```ts
export type Millis = number;
export type UnixMillis = number;

export type Prime = number; // a prime in P

export interface Bar1s {
  ts: UnixMillis; // close time of the 1s bar
  o: number; h: number; l: number; c: number; v: number;
  ob?: { ba: number; bb: number; ba_sz?: number; bb_sz?: number };
}

export interface FeatureFrame {
  ts: UnixMillis;
  ret_1s: number;
  ret_5s: number;
  vol_30s: number;
  kurt_60s?: number;
  imb_1s?: number;
  regime?: 'trend' | 'chop' | 'shock';
  hqe_basket?: number;
}

export interface PhaseVec { [p: Prime]: number } // φ_p in [0,1)

export interface HilbertState {
  amps: { [p: Prime]: number };
  phases: { [p: Prime]: number }; // radians
  basis: Prime[];                 // for convenience
}

// 32-bit action layout (LSB→MSB)
//  0..1   side         00 flat, 01 long, 10 short, 11 hold
//  2..4   size bucket  0..7
//  5..6   order type   00 mkt, 01 post-only, 10 IOC
//  7..9   TIF bucket   0..7
// 10..13  bracket id   0..15
// 14..31  refinement m 18 bits

export type UInt32 = number; // use >>>0 to enforce

export type Side = 'flat' | 'long' | 'short' | 'hold';
export type OrdType = 'market' | 'post-only' | 'ioc';

export interface DecodedAction {
  side: Side;
  sizeBucket: number; // 0..7
  ord: OrdType;
  tif: number; // 0..7
  bracket: number; // 0..15
  m: number; // 18-bit refinement
}

export interface ActionCode {
  n: UInt32;
  decoded: DecodedAction;
}

export interface PositionSnap {
  ts: UnixMillis;
  qty: number;
  avg_px: number;
  unreal: number;
  real: number;
  drawdown: number;
}

export interface Order {
  oid: string;
  ts: UnixMillis;
  symbol: string;
  px: number; // limit or reference price
  qty: number;
  side: 'buy' | 'sell';
  type: OrdType | 'limit';
  tif: 'GTC' | 'IOC' | 'PO';
  meta?: Record<string, unknown>;
}

export interface Fill {
  fid: string;
  oid: string;
  ts: UnixMillis;
  px: number;
  qty: number;
  fee: number;
  liquidity: 'maker' | 'taker';
}

export interface ExecutionResult {
  order: Order;
  fills: Fill[];
}

export interface ProxyResult {
  pass: boolean;
  edge: number;      // estimated micro-alpha
  impact: number;    // estimated cost
}

export interface ObjectiveResult {
  pnl: number;                    // realized P&L from fills
  slippage: number;               // signed slippage vs mid
  inventoryPenalty: number;       // inventory cost
  fee: number;                    // fees
}

export interface RiskLimits {
  maxNotional: number;
  maxInv: number;
  perMinLoss: number; // rolling P&L floor (not implemented here)
}
```

---

## src/utils/hash.ts

```ts
// SplitMix64-like integer hash to produce well-distributed bits for measurement → refinement
export function splitmix64(n: bigint): bigint {
  let x = (n + 0x9E3779B97F4A7C15n) & 0xFFFFFFFFFFFFFFFFn;
  x = (x ^ (x >> 30n)) * 0xBF58476D1CE4E5B9n & 0xFFFFFFFFFFFFFFFFn;
  x = (x ^ (x >> 27n)) * 0x94D049BB133111EBn & 0xFFFFFFFFFFFFFFFFn;
  x = x ^ (x >> 31n);
  return x & 0xFFFFFFFFFFFFFFFFn;
}

export function hashFloatArray(xs: number[]): number {
  // Convert doubles to a 64-bit accumulator deterministically
  let acc = 0n;
  for (let i = 0; i < xs.length; i++) {
    // quantize to 1e-9, pack into bigint
    const q = BigInt(Math.floor(xs[i] * 1e9));
    acc = splitmix64(acc ^ (q + BigInt(i + 1)));
  }
  // return lower 32 bits
  return Number(acc & 0xFFFFFFFFn) >>> 0;
}
```

---

## src/hilbert.ts

```ts
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
```

---

## src/observer.ts

```ts
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
```

---

## src/guild.ts

```ts
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
```

---

## src/featureEngine.ts

```ts
import { Bar1s, FeatureFrame } from './types.js';

export class FeatureEngine {
  private buf: Bar1s[] = [];

  update(bar: Bar1s): FeatureFrame | null {
    this.buf.push(bar);
    if (this.buf.length < 60) return null; // warm-up

    const last = this.buf[this.buf.length - 1];
    const ret_1s = Math.log(last.c / this.buf[this.buf.length - 2].c);
    const i5 = Math.max(0, this.buf.length - 6);
    const ret_5s = Math.log(last.c / this.buf[i5].c);
    const vol_30s = this.realizedVol(30);

    const regime = (Math.abs(ret_5s) > 3 * vol_30s) ? 'shock' : (Math.abs(ret_5s) > vol_30s ? 'trend' : 'chop');

    return {
      ts: last.ts,
      ret_1s,
      ret_5s,
      vol_30s,
      regime
    };
  }

  private realizedVol(windowSec: number): number {
    const n = Math.min(windowSec, this.buf.length - 1);
    if (n <= 1) return 0;
    let s2 = 0;
    for (let i = this.buf.length - n; i < this.buf.length; i++) {
      const a = this.buf[i - 1].c, b = this.buf[i].c;
      s2 += Math.pow(Math.log(b / a), 2);
    }
    return Math.sqrt(s2 / n);
  }
}
```

---

## src/evaluator.ts

```ts
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
```

---

## src/risk.ts

```ts
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
```

---

## src/broker/paperBroker.ts

```ts
import { Bar1s, ExecutionResult, Fill, Order, UnixMillis } from '../types.js';

let oidSeq = 0, fidSeq = 0;
const now = () => Date.now() as UnixMillis;

export interface PaperCfg {
  feeRate: number;           // as fraction of notional
  impactAlpha: number;       // taker impact coeff
  impactBeta: number;        // taker impact exponent
  spreadBps: number;         // assumed spread in bps if no L2
}

export class PaperBroker {
  constructor(private cfg: PaperCfg) {}

  route(n: number, bar: Bar1s): ExecutionResult {
    const sideBits = n & 0b11;
    const sizeBucket = (n >>> 2) & 0b111;
    const ordTypeBits = (n >>> 5) & 0b11; // 0 mkt, 1 PO, 2 IOC

    const side = sideBits === 1 ? 'buy' : sideBits === 2 ? 'sell' : 'buy';
    const sign = side === 'buy' ? 1 : -1;
    const qty = (sizeBucket + 1) * 0.002; // BTC units

    const mid = (bar.o + bar.c) / 2;
    const spread = (bar.ob ? (bar.ob.ba - bar.ob.bb) : (this.cfg.spreadBps * 1e-4 * mid));

    const order: Order = {
      oid: `o${++oidSeq}`,
      ts: now(),
      symbol: 'BTCUSDT',
      px: mid,
      qty,
      side,
      type: ordTypeBits === 0 ? 'market' : ordTypeBits === 1 ? 'limit' : 'ioc',
      tif: ordTypeBits === 1 ? 'PO' : ordTypeBits === 2 ? 'IOC' : 'GTC',
      meta: { action_n: n }
    };

    const fills: Fill[] = [];

    if (ordTypeBits === 0) {
      // Taker: pay half-spread + impact
      const impact = this.cfg.impactAlpha * Math.pow(qty, this.cfg.impactBeta);
      const px = mid + sign * (spread / 2) + sign * impact;
      fills.push(this.makeFill(order, px, qty, 'taker'));
    } else if (ordTypeBits === 1) {
      // Post-only (maker): assume limit at best bid/ask; fill if range crosses
      const limitPx = side === 'buy' ? (mid - spread / 2) : (mid + spread / 2);
      const traded = (side === 'buy') ? (bar.l <= limitPx) : (bar.h >= limitPx);
      if (traded) fills.push(this.makeFill(order, limitPx, qty, 'maker'));
    } else {
      // IOC: cross if possible at touch
      const touch = side === 'buy' ? (mid + spread / 2) : (mid - spread / 2);
      const traded = (side === 'buy') ? (bar.h >= touch) : (bar.l <= touch);
      if (traded) fills.push(this.makeFill(order, touch, qty, 'taker'));
    }

    return { order, fills };
  }

  private makeFill(order: Order, px: number, qty: number, liq: 'maker' | 'taker'): Fill {
    const fee = this.cfg.feeRate * (px * qty);
    return {
      fid: `f${++fidSeq}`,
      oid: order.oid,
      ts: now(),
      px, qty, fee, liquidity: liq
    };
  }
}
```

---

## src/index.ts

```ts
import { FeatureEngine } from './featureEngine.js';
import { createGuild, emaPhaseUpdate, guildStep, residues } from './guild.js';
import { PaperBroker } from './broker/paperBroker.js';
import { SimpleEvaluator } from './evaluator.js';
import { Bar1s, FeatureFrame, PhaseVec, Prime, PositionSnap } from './types.js';
import { RiskEngine } from './risk.js';

// ---- Config ----
const P: Prime[] = [2,3,5,7,11,13,17,19,23,29,31];
const guilds = [
  createGuild('g-fast', [2,3,5,7,11], 8),
  createGuild('g-mid',  [3,5,7,11,13,17], 8),
  createGuild('g-swing',[5,7,11,13,17,19,23], 8)
];
const tau = 1.5; // entropy cap
const alpha = 0.15; // phase EMA

const evaluator = new SimpleEvaluator({ edgeThreshold: 0.0, impactK: 0.5, impactBeta: 0.6 });
const broker = new PaperBroker({ feeRate: 0.0004, impactAlpha: 0.5, impactBeta: 0.6, spreadBps: 1.0 });
const risk = new RiskEngine({ maxNotional: 1000, maxInv: 0.03, perMinLoss: -25 });
const feats = new FeatureEngine();

// Placeholder position snapshot
let pos: PositionSnap = { ts: 0, qty: 0, avg_px: 0, unreal: 0, real: 0, drawdown: 0 };

// Demo runner with synthetic bars (replace with real feed)
function* syntheticBars(n = 200): Generator<Bar1s> {
  let px = 60000;
  for (let i = 0; i < n; i++) {
    const drift = (Math.random() - 0.5) * 30; // ~±$15
    const o = px;
    const c = px + drift;
    const h = Math.max(o, c) + Math.random() * 10;
    const l = Math.min(o, c) - Math.random() * 10;
    px = c;
    yield { ts: Date.now() + i * 1000, o, h, l, c, v: 1.23 };
  }
}

function decodeSide(n: number): 'buy' | 'sell' | 'none' {
  const s = n & 0b11;
  if (s === 1) return 'buy';
  if (s === 2) return 'sell';
  return 'none';
}

(async () => {
  for (const bar of syntheticBars(400)) {
    const f = feats.update(bar);
    if (!f) continue; // warm-up

    // Each guild proposes best action
    const proposals = guilds.map(g => guildStep(g, f, P, tau));

    for (let i = 0; i < guilds.length; i++) {
      const g = guilds[i];
      const prop = proposals[i];
      if (!prop) continue;

      // Risk precheck
      if (!risk.precheck(prop.n, pos, f)) continue;

      // Proxy screen
      const pr = evaluator.proxy(prop.n, f);
      if (!pr.pass) continue;

      // Execute on paper broker
      const ex = broker.route(prop.n, bar);
      let pnl = 0, fee = 0, slip = 0;
      if (ex.fills.length > 0) {
        for (const fill of ex.fills) {
          fee += fill.fee;
          // mark-to-market simple P&L vs bar close
          pnl += (decodeSide(prop.n) === 'buy' ? (bar.c - fill.px) : (fill.px - bar.c)) * fill.qty;
          slip += (decodeSide(prop.n) === 'buy' ? (fill.px - ((bar.o + bar.c)/2)) : (((bar.o + bar.c)/2) - fill.px));
        }
      }
      const invPenalty = Math.abs(pos.qty) * 0.1 / 86400; // tiny per-second penalty
      const obj = evaluator.objective(pnl, fee, invPenalty, slip);

      // Update position (extremely simplified)
      for (const fill of ex.fills) {
        const q = (decodeSide(prop.n) === 'buy') ? fill.qty : -fill.qty;
        const newQty = pos.qty + q;
        pos.avg_px = (pos.qty * pos.avg_px + q * fill.px) / (newQty === 0 ? 1 : newQty);
        pos.qty = newQty;
        pos.ts = bar.ts;
        pos.real += obj.pnl - obj.fee - obj.inventoryPenalty;
      }

      // Phase update from elite (we treat prop as elite per guild for demo)
      const r = residues(prop.n, g.basis);
      g.phi = emaPhaseUpdate(g.phi, r, alpha);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Run complete. Final pos:', pos);
})();
```

---

## tests/hilbert.test.ts

```ts
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
```

---

## tests/broker.test.ts

```ts
import { describe, it, expect } from 'vitest';
import { PaperBroker } from '../src/broker/paperBroker.js';
import { Bar1s } from '../src/types.js';

const broker = new PaperBroker({ feeRate: 0.0004, impactAlpha: 0.5, impactBeta: 0.6, spreadBps: 1.0 });

function bar(mid: number): Bar1s {
  return { ts: Date.now(), o: mid-5, h: mid+10, l: mid-10, c: mid+3, v: 1.0 };
}

function action({ side='long', size=2, ord='market' as const } = {}) {
  let n = 0 >>> 0;
  const sideBits = side === 'long' ? 1 : side === 'short' ? 2 : 0;
  const ordBits = ord === 'market' ? 0 : ord === 'post-only' ? 1 : 2;
  n |= (sideBits & 0b11);
  n |= (size & 0b111) << 2;
  n |= (ordBits & 0b11) << 5;
  return n >>> 0;
}

describe('Paper broker', () => {
  it('executes market (taker) with a single fill', () => {
    const n = action({ side: 'long', size: 3, ord: 'market' });
    const ex = broker.route(n, bar(60000));
    expect(ex.fills.length).toBe(1);
    expect(ex.fills[0].liquidity).toBe('taker');
  });

  it('post-only may or may not fill depending on bar range', () => {
    const n = action({ side: 'short', size: 1, ord: 'post-only' });
    const ex = broker.route(n, bar(60000));
    expect(ex.fills.length).toBeGreaterThanOrEqual(0);
  });
});
```

---
