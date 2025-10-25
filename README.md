# Prime-Hilbert RL Trader – Starter Repo (TypeScript)

This is a minimal, modular scaffold for a 1-second BTCUSDT paper-trading agent using the Observer Ecology + Prime-Hilbert operators (Π, E, M).

## Quickstart

```bash
pnpm i   # or npm i / yarn
pnpm test
pnpm build && pnpm start
```

## Scripts

* `pnpm start` – runs `node dist/index.js`
* `pnpm dev` – ts-node dev run (nodemon-like via ts-node-dev)
* `pnpm test` – vitest
* `pnpm build` – tsc build

## Configure

See `src/index.ts` for the MVP configuration (primes, guilds, risk limits). Replace the `FeatureEngine` stub with your feed + real features.

## Notes

* **Actions** are 32-bit integers with bit layout documented in `types.ts`.
* **Π, E, M** implemented in `hilbert.ts`.
* **Paper broker** simulates taker/maker fills inside the 1s bar.
* **Risk engine** blocks orders exceeding caps.

## License

MIT (do what you like; no warranty).
