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
