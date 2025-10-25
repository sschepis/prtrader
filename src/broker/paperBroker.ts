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
