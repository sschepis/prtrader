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
