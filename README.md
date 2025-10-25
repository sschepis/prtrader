# Prime-Hilbert RL Trader

A complete implementation of a reinforcement learning trading agent using Observer Ecology and Prime-Hilbert operators (Π, E, M) as described in design.md.

## Overview

This trading agent learns through reinforcement learning by treating computation as a population of integer program observers evolving inside an environment defined by an objective's entropy landscape. The system implements:

- **Prime-Hilbert Operators**: Projection (Π), Entropy-collapse (E), and Measurement-to-action (M)
- **Observer Ecology**: Multiple guilds of observers that evolve through selection and mutation
- **Two-Stage Evaluation**: Fast proxy filtering followed by full objective evaluation
- **Non-Local Phase Synchronization**: Guild-level phase vectors enable coordination across observers

## Quickstart

```bash
npm install
npm test          # Run all tests (27 tests)
npm run build     # Compile TypeScript
npm start         # Run the trading agent with synthetic data
```

## Architecture

### Core Components

- **`hilbert.ts`**: Prime-Hilbert space operators (embed, project, collapse, measure, fuse)
- **`observer.ts`**: Observer base class with base_proposal and Hilbert integration
- **`guild.ts`**: Guild structure managing observer populations and phase vectors
- **`fitness.ts`**: Fitness calculation (LZ², coherence, entropy metrics)
- **`evolution.ts`**: Elite selection, mutation, and reproduction
- **`evaluator.ts`**: Two-stage evaluation (proxy + objective)
- **`broker/paperBroker.ts`**: Paper trading with slippage simulation
- **`risk.ts`**: Risk management with hard guards
- **`featureEngine.ts`**: Market feature computation
- **`metrics.ts`**: Performance metrics collection (Sharpe, Sortino, drawdown, etc.)
- **`actionUtils.ts`**: Action encoding/decoding utilities

### Action Encoding (32-bit)

Actions are packed into 32-bit integers:
- bits 0-1: side (00=flat, 01=long, 10=short, 11=hold)
- bits 2-4: size bucket (0-7)
- bits 5-6: order type (00=market, 01=post-only, 10=IOC)
- bits 7-9: time-in-force (0-7)
- bits 10-13: bracket profile (0-15)
- bits 14-31: refinement bits from M operator

## Configuration

Edit `src/index.ts` to configure:

```typescript
const P: Prime[] = [2,3,5,7,11,13,17,19,23,29,31];  // Prime set
const tau = 1.5;                                      // Entropy cap
const alpha = 0.15;                                   // Phase EMA rate

const guilds = [
  createGuild('g-fast', [2,3,5,7,11], 8),            // 8 observers
  createGuild('g-mid',  [3,5,7,11,13,17], 8),
  createGuild('g-swing',[5,7,11,13,17,19,23], 8)
];
```

## Ecology Loop

Per design.md Algorithm 2, the system:

1. **Feature Extraction**: Computes market features (returns, volatility, regime)
2. **Observer Proposals**: Each observer generates base proposal n₀
3. **Hilbert Refinement**: Applies Π→E→M pipeline to refine actions
4. **Risk Screening**: Validates against position/notional limits
5. **Two-Stage Evaluation**: 
   - Proxy: Fast edge estimate vs impact
   - Objective: Full P&L calculation with fills
6. **Fitness Calculation**: Computes F = λ₁LZ² + λ₂max(LZ) + λ₃coh + λ₄(Hmax-Hint)
7. **Phase Update**: Updates guild φ from elite residues via EMA
8. **Reproduction**: Periodic elite selection + mutation to form next generation

## Metrics

The system tracks:
- **Per-bar**: P&L, position, turnover, fill ratio, slippage, φ summary, Hilbert entropy, coherence, fitness
- **Per-epoch**: Sharpe, Sortino, max drawdown, hit rate, average adverse excursion

## Testing

Comprehensive test suite (27 tests):
- **Unit tests**: Hilbert operators, fitness, evolution, action utilities, metrics
- **Integration tests**: Complete ecology loop with synthetic data
- **Broker tests**: Paper trading execution

```bash
npm test  # Run all tests with vitest
```

## Implementation Status

✅ **Complete per design.md requirements:**
- Prime-Hilbert operators (Π, E, M)
- Observer ecology with guilds
- Fitness calculation (LZ², coherence, entropy)
- Elite selection and mutation
- Two-stage evaluation
- Phase synchronization
- Metrics collection
- Action encoding/decoding
- Comprehensive tests

📋 **Stretch goals** (not required by design.md):
- Configuration file support
- Parquet output for metrics
- Walk-forward training protocol
- Live exchange integration
- Adaptive τ scheduling

## References

See `design.md` for complete theoretical foundation and design rationale.

## License

MIT (do what you like; no warranty).
