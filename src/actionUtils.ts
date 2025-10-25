import { DecodedAction, Side, OrdType, UInt32 } from './types.js';

/**
 * Decode a 32-bit action into its components per design.md section 1.3
 * Layout:
 *  bits 0..1   side         00 flat, 01 long, 10 short, 11 hold
 *  bits 2..4   size bucket  0..7
 *  bits 5..6   order type   00 mkt, 01 post-only, 10 IOC
 *  bits 7..9   TIF bucket   0..7
 *  bits 10..13 bracket id   0..15
 *  bits 14..31 refinement m 18 bits
 */
export function decodeAction(n: UInt32): DecodedAction {
  const sideBits = n & 0b11;
  const sizeBucket = (n >>> 2) & 0b111;
  const ordBits = (n >>> 5) & 0b11;
  const tif = (n >>> 7) & 0b111;
  const bracket = (n >>> 10) & 0b1111;
  const m = (n >>> 14) & 0x3FFFF;
  
  let side: Side = 'flat';
  if (sideBits === 0b01) side = 'long';
  else if (sideBits === 0b10) side = 'short';
  else if (sideBits === 0b11) side = 'hold';
  
  let ord: OrdType = 'market';
  if (ordBits === 0b01) ord = 'post-only';
  else if (ordBits === 0b10) ord = 'ioc';
  
  return { side, sizeBucket, ord, tif, bracket, m };
}

/**
 * Encode components into a 32-bit action
 */
export function encodeAction(decoded: DecodedAction): UInt32 {
  let n = 0 >>> 0;
  
  let sideBits = 0;
  if (decoded.side === 'long') sideBits = 0b01;
  else if (decoded.side === 'short') sideBits = 0b10;
  else if (decoded.side === 'hold') sideBits = 0b11;
  
  let ordBits = 0;
  if (decoded.ord === 'post-only') ordBits = 0b01;
  else if (decoded.ord === 'ioc') ordBits = 0b10;
  
  n |= (sideBits & 0b11);
  n |= (decoded.sizeBucket & 0b111) << 2;
  n |= (ordBits & 0b11) << 5;
  n |= (decoded.tif & 0b111) << 7;
  n |= (decoded.bracket & 0b1111) << 10;
  n |= (decoded.m & 0x3FFFF) << 14;
  
  return n >>> 0;
}

/**
 * Get human-readable description of action
 */
export function describeAction(n: UInt32): string {
  const d = decodeAction(n);
  return `${d.side} size=${d.sizeBucket} ${d.ord} tif=${d.tif} bracket=${d.bracket} refinement=0x${d.m.toString(16)}`;
}

/**
 * Convert action to order side
 */
export function actionToOrderSide(n: UInt32): 'buy' | 'sell' | 'none' {
  const sideBits = n & 0b11;
  if (sideBits === 0b01) return 'buy';
  if (sideBits === 0b10) return 'sell';
  return 'none';
}

/**
 * Extract quantity from action based on size bucket and config
 */
export interface SizeConfig {
  buckets: number[]; // BTC units per bucket
}

export function actionToQuantity(n: UInt32, config: SizeConfig): number {
  const d = decodeAction(n);
  return config.buckets[d.sizeBucket] ?? 0;
}
