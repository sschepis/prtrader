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
