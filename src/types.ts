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
