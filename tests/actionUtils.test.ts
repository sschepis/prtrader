import { describe, it, expect } from 'vitest';
import { decodeAction, encodeAction, describeAction, actionToOrderSide } from '../src/actionUtils.js';

describe('Action utilities', () => {
  it('decodeAction extracts all fields correctly', () => {
    // Build action: long, size=3, market, tif=2, bracket=5, refinement=0xABCD
    let n = 0 >>> 0;
    n |= 0b01; // long
    n |= (3 & 0b111) << 2; // size bucket 3
    n |= (0 & 0b11) << 5; // market
    n |= (2 & 0b111) << 7; // tif 2
    n |= (5 & 0b1111) << 10; // bracket 5
    n |= (0xABCD & 0x3FFFF) << 14; // refinement
    
    const decoded = decodeAction(n);
    
    expect(decoded.side).toBe('long');
    expect(decoded.sizeBucket).toBe(3);
    expect(decoded.ord).toBe('market');
    expect(decoded.tif).toBe(2);
    expect(decoded.bracket).toBe(5);
    expect(decoded.m).toBe(0xABCD);
  });

  it('encodeAction produces correct bit pattern', () => {
    const decoded = {
      side: 'short' as const,
      sizeBucket: 4,
      ord: 'post-only' as const,
      tif: 1,
      bracket: 7,
      m: 0x12345
    };
    
    const n = encodeAction(decoded);
    const redecoded = decodeAction(n);
    
    expect(redecoded.side).toBe('short');
    expect(redecoded.sizeBucket).toBe(4);
    expect(redecoded.ord).toBe('post-only');
    expect(redecoded.tif).toBe(1);
    expect(redecoded.bracket).toBe(7);
    expect(redecoded.m).toBe(0x12345);
  });

  it('actionToOrderSide returns correct side', () => {
    const longAction = encodeAction({
      side: 'long',
      sizeBucket: 1,
      ord: 'market',
      tif: 0,
      bracket: 0,
      m: 0
    });
    
    const shortAction = encodeAction({
      side: 'short',
      sizeBucket: 1,
      ord: 'market',
      tif: 0,
      bracket: 0,
      m: 0
    });
    
    expect(actionToOrderSide(longAction)).toBe('buy');
    expect(actionToOrderSide(shortAction)).toBe('sell');
  });

  it('describeAction produces readable string', () => {
    const n = encodeAction({
      side: 'long',
      sizeBucket: 2,
      ord: 'ioc',
      tif: 3,
      bracket: 4,
      m: 0xABC
    });
    
    const desc = describeAction(n);
    expect(desc).toContain('long');
    expect(desc).toContain('size=2');
    expect(desc).toContain('ioc');
  });
});
