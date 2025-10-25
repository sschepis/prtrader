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
