import { FeatureEngine } from './featureEngine.js';
import { createGuild, emaPhaseUpdate, guildStep, residues } from './guild.js';
import { PaperBroker } from './broker/paperBroker.js';
import { SimpleEvaluator } from './evaluator.js';
import { Bar1s, FeatureFrame, PhaseVec, Prime, PositionSnap } from './types.js';
import { RiskEngine } from './risk.js';
import { computeLZ, aggregateFitness, computeFitness, ObserverEval } from './fitness.js';
import { selectElite, reproducePopulation } from './evolution.js';
import { MetricsCollector, summarizePhases } from './metrics.js';
import { actionToOrderSide } from './actionUtils.js';

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
const metricsCollector = new MetricsCollector();

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

// Removed decodeSide - now using actionToOrderSide from actionUtils

(async () => {
  let barCount = 0;
  const REPRODUCTION_INTERVAL = 100; // reproduce every N bars
  
  for (const bar of syntheticBars(400)) {
    const f = feats.update(bar);
    if (!f) continue; // warm-up
    
    barCount++;

    // Each guild proposes actions from all observers and tracks fitness
    for (const g of guilds) {
      const evals: ObserverEval[] = [];
      const fitnessScores = new Map<string, number>();
      let bestAction: { n: number; score: number } | null = null;
      
      // Evaluate all observers in the guild
      for (const obs of g.observers) {
        const n0 = obs.base_proposal(f);
        const Ψ1 = obs.embed(n0, P, g.phi);
        const Ψ2 = obs.project(Ψ1, g.basis);
        const Ψ3 = obs.collapse(Ψ2, tau);
        const m = obs.measure(Ψ3);
        const n = obs.fuse(n0, m);
        
        // Risk precheck
        if (!risk.precheck(n, pos, f)) continue;
        
        // Proxy screen
        const pr = evaluator.proxy(n, f);
        if (!pr.pass) continue;
        
        // Execute on paper broker
        const ex = broker.route(n, bar);
        let pnl = 0, fee = 0, slip = 0;
        if (ex.fills.length > 0) {
          for (const fill of ex.fills) {
            fee += fill.fee;
            // mark-to-market simple P&L vs bar close
            const side = actionToOrderSide(n);
            pnl += (side === 'buy' ? (bar.c - fill.px) : (fill.px - bar.c)) * fill.qty;
            slip += (side === 'buy' ? (fill.px - ((bar.o + bar.c)/2)) : (((bar.o + bar.c)/2) - fill.px));
          }
          
          // Update position (extremely simplified)
          for (const fill of ex.fills) {
            const side = actionToOrderSide(n);
            const q = (side === 'buy') ? fill.qty : -fill.qty;
            const newQty = pos.qty + q;
            pos.avg_px = (pos.qty * pos.avg_px + q * fill.px) / (newQty === 0 ? 1 : newQty);
            pos.qty = newQty;
            pos.ts = bar.ts;
          }
        }
        
        const invPenalty = Math.abs(pos.qty) * 0.1 / 86400;
        const obj = evaluator.objective(pnl, fee, invPenalty, slip);
        pos.real += obj.pnl - obj.fee - obj.inventoryPenalty;
        
        // Compute LZ score for this evaluation
        const lzScore = computeLZ(obj.pnl, obj.fee, obj.slippage);
        
        // Track evaluation
        evals.push({
          observerId: obs.id,
          n,
          hilbertState: Ψ3,
          lzScore,
          timestamp: bar.ts
        });
        
        // Track best action for phase update
        if (!bestAction || lzScore > bestAction.score) {
          bestAction = { n, score: lzScore };
        }
      }
      
      // Compute guild fitness metrics
      if (evals.length > 0) {
        const fitnessMetrics = aggregateFitness(evals);
        const fitness = computeFitness(fitnessMetrics);
        
        // Store fitness for each observer (simplified - use same guild fitness)
        for (const ev of evals) {
          fitnessScores.set(ev.observerId, fitness);
        }
        
        // Collect metrics
        metricsCollector.recordBar({
          ts: bar.ts,
          guildId: g.id,
          pnl: pos.real,
          position: pos.qty,
          turnover: evals.length, // simplified
          fillRatio: evals.length / g.observers.length,
          slippage: 0, // would track cumulative
          fee: 0, // would track cumulative
          phiSummary: summarizePhases(g.phi),
          hilbertEntropy: fitnessMetrics.Hint,
          coherence: fitnessMetrics.coherence,
          fitness
        });
      }
      
      // Phase update from best action
      if (bestAction) {
        const r = residues(bestAction.n, g.basis);
        g.phi = emaPhaseUpdate(g.phi, r, alpha);
      }
      
      // Reproduce population periodically
      if (barCount % REPRODUCTION_INTERVAL === 0 && fitnessScores.size > 0) {
        const elites = selectElite(g.observers, fitnessScores, 2);
        g.observers = reproducePopulation(g, elites, g.observers.length, 2, 0.1);
      }
    }
  }

  // Final summary
  // eslint-disable-next-line no-console
  console.log('Run complete. Final position:', pos);
  // eslint-disable-next-line no-console
  console.log('Bars processed:', barCount);
  // eslint-disable-next-line no-console
  console.log('Guild phases:');
  for (const g of guilds) {
    // eslint-disable-next-line no-console
    console.log(`  ${g.id}:`, summarizePhases(g.phi));
  }
})();
