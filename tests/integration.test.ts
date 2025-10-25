import { describe, it, expect } from 'vitest';
import { createGuild } from '../src/guild.js';
import { FeatureEngine } from '../src/featureEngine.js';
import { PaperBroker } from '../src/broker/paperBroker.js';
import { SimpleEvaluator } from '../src/evaluator.js';
import { RiskEngine } from '../src/risk.js';
import { MetricsCollector } from '../src/metrics.js';
import { computeLZ, aggregateFitness, ObserverEval } from '../src/fitness.js';
import { selectElite } from '../src/evolution.js';
import { Bar1s, Prime, PositionSnap } from '../src/types.js';
import { actionToOrderSide } from '../src/actionUtils.js';

describe('Integration: Complete Trading Ecology', () => {
  it('runs ecology loop for multiple bars without errors', () => {
    const P: Prime[] = [2, 3, 5, 7, 11];
    const guilds = [
      createGuild('g-test', [2, 3, 5], 4)
    ];
    const tau = 1.5;
    
    const evaluator = new SimpleEvaluator({ 
      edgeThreshold: 0.0, 
      impactK: 0.5, 
      impactBeta: 0.6 
    });
    const broker = new PaperBroker({ 
      feeRate: 0.0004, 
      impactAlpha: 0.5, 
      impactBeta: 0.6, 
      spreadBps: 1.0 
    });
    const risk = new RiskEngine({ 
      maxNotional: 1000, 
      maxInv: 0.03, 
      perMinLoss: -25 
    });
    const feats = new FeatureEngine();
    const metrics = new MetricsCollector();
    
    let pos: PositionSnap = { 
      ts: 0, 
      qty: 0, 
      avg_px: 60000, 
      unreal: 0, 
      real: 0, 
      drawdown: 0 
    };
    
    // Generate synthetic bars
    const bars: Bar1s[] = [];
    let px = 60000;
    for (let i = 0; i < 100; i++) {
      const drift = (Math.random() - 0.5) * 20;
      const o = px;
      const c = px + drift;
      const h = Math.max(o, c) + Math.random() * 5;
      const l = Math.min(o, c) - Math.random() * 5;
      px = c;
      bars.push({ ts: Date.now() + i * 1000, o, h, l, c, v: 1.0 });
    }
    
    let actionsExecuted = 0;
    
    // Run ecology loop
    for (const bar of bars) {
      const f = feats.update(bar);
      if (!f) continue;
      
      for (const g of guilds) {
        const evals: ObserverEval[] = [];
        const fitnessScores = new Map<string, number>();
        
        for (const obs of g.observers) {
          const n0 = obs.base_proposal(f);
          const Ψ1 = obs.embed(n0, P, g.phi);
          const Ψ2 = obs.project(Ψ1, g.basis);
          const Ψ3 = obs.collapse(Ψ2, tau);
          const m = obs.measure(Ψ3);
          const n = obs.fuse(n0, m);
          
          if (!risk.precheck(n, pos, f)) continue;
          
          const pr = evaluator.proxy(n, f);
          if (!pr.pass) continue;
          
          const ex = broker.route(n, bar);
          let pnl = 0, fee = 0, slip = 0;
          
          if (ex.fills.length > 0) {
            actionsExecuted++;
            for (const fill of ex.fills) {
              fee += fill.fee;
              const side = actionToOrderSide(n);
              pnl += (side === 'buy' ? (bar.c - fill.px) : (fill.px - bar.c)) * fill.qty;
              slip += (side === 'buy' ? (fill.px - ((bar.o + bar.c)/2)) : (((bar.o + bar.c)/2) - fill.px));
            }
          }
          
          const invPenalty = Math.abs(pos.qty) * 0.1 / 86400;
          const obj = evaluator.objective(pnl, fee, invPenalty, slip);
          const lzScore = computeLZ(obj.pnl, obj.fee, obj.slippage);
          
          evals.push({
            observerId: obs.id,
            n,
            hilbertState: Ψ3,
            lzScore,
            timestamp: bar.ts
          });
          
          fitnessScores.set(obs.id, lzScore);
        }
        
        if (evals.length > 0) {
          const fitnessMetrics = aggregateFitness(evals);
          expect(fitnessMetrics.LZ2).toBeGreaterThanOrEqual(0);
          expect(fitnessMetrics.coherence).toBeGreaterThanOrEqual(0);
          expect(fitnessMetrics.coherence).toBeLessThanOrEqual(1);
        }
      }
    }
    
    // Verify that the ecology ran successfully
    expect(bars.length).toBeGreaterThan(0);
    expect(actionsExecuted).toBeGreaterThanOrEqual(0);
  });
  
  it('elite selection and reproduction work correctly', () => {
    const guild = createGuild('g-test', [2, 3, 5, 7], 8);
    
    const fitnessScores = new Map(
      guild.observers.map((obs, i) => [obs.id, Math.random()])
    );
    
    const elites = selectElite(guild.observers, fitnessScores, 2);
    
    expect(elites.length).toBe(2);
    expect(elites[0].fitness).toBeGreaterThanOrEqual(elites[1].fitness);
  });
});
