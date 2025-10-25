a stock/forex/crypto trading agent that learns through reinforcement learning

Observer Ecologies as Entropy-Minimizing Integer Programs: Prime-Hilbert Operators for ML, AI, and Problem Solving
Sebastian Schepis Bitgem
September 5, 2025
Abstract
We introduce a learning paradigm that treats computation as a population of integer program observers evolving inside an environment defined by an objective’s entropy landscape. Each observer is an integer program that proposes discrete actions (e.g., candidate solutions in a search space) which are scored by the environment and fed back into the ecology. The ecology organizes into guilds sharing prime-indexed resonance structure. A set of prime-based Hilbert operators—projection Π, entropy-collapse E, and measurement-to-action M—implements a gradient-free yet structured learning dynamic that reduces entropy and increases coherence over time. We formalize the approach and show how it applies to ML/AI search, combinatorial optimization, and non-local coordination. An implementation with open-source notebooks demonstrates the method end-to-end.
1 Introduction
Modern ML excels when gradients exist. Yet many real problems are discrete, non-differentiable, or system-level: you need coordination among diverse subroutines, each facing sparse rewards and huge search spaces. We propose to architect learning systems as ecologies of integer program observers that collectively minimize entropy of an objective while synchronizing by prime-resonant structure. The core contributions are:
2
1. 2. 3. 4.
A formal link between integer programs and entropy minimization via prime-indexed Hilbert em- beddings.
A trio of prime Hilbert operators (Π, E, M) that project to a basis, softly collapse entropy, and map measurements to discrete actions.
An observer ecology that evolves guild-level phase vectors through non-local updates and converges toward coherent, low-entropy policies.
A concrete case study in combinatorial optimization; the same machinery ported to general AI tasks.
Background & Motivation
Integer Programs as Observers. We call an observer any terminating integer program O : Zk → Z with internal finite state that, given context, proposes a discrete action n ∈ {0, . . . , 232 − 1}. An ecology is a finite multiset of observers with variation and selection.
Entropy Minimization. Let S denote the environment that assigns each action a score. We track (i) a Shannon-like entropy of internal observer features (to favor focus), and (ii) an output entropy proxy of scores (e.g., negative log-likelihood or constraint violation count). Learning is defined as jointly reducing these entropies while increasing coherence across observers.
Prime Resonance. We embed integers into a prime-indexed Hilbert space where primes serve as discrete eigenmodes of structure. This enables non-local synchronization: observers that emphasize the same prime modes can align phases without direct message passing.
1

3 Preliminaries 3.1 Entropy Proxies
Given a score digest h (e.g., a hashed or encoded objective value), define LZ(h) as a proxy for low entropy, such as the number of satisfied constraints or inverse variance. For internal tuples (x1, . . . , xm), define
∑∑
H(x) = − pi log2 pi on normalized magnitudes pi = |xi|/ 3.2 Integer Programs
An observer O maintains state s ∈ Zd and outputs n = O(s, θ, ξ) where θ are parameters and ξ are latent counters. Mutation acts on (θ, ξ); selection is by fitness.
3.3 Prime Hilbert Space
Let P = {p1, . . . , pM } be the first M primes. The Hilbert embedding of an integer n is the amplitude– phase field
Ψ(n) := {p 7→ (ap(n), φp(n))}p∈P ,
with amplitudes ap(n) ∝ 1 − n mod p (normalized) and phases φp(n) ≡ 2π n mod p + φp mod 2π, where
j
|xj| (with the 0log0 = 0 convention).
  pp φp are guild-level phase parameters.
Amplitude/Phase
φ3
a22 3 5 7
  Amplitude
Phase
...
Primes
We introduce three operators per observer/guild:
ΠB (Projection). For basis B ⊆ P, ΠBΨ keeps prime channels in B and renormalizes amplitudes.
Eτ (Entropy Collapse). Soft top-k pruning on amplitudes until H(Ψ) ≤ τ; τ sets focus.
M (Measurement-to-Action). A deterministic mixer that maps (ap,φp) to a 32-bit refinement m, fused with a base proposal to yield an action n.
Writing n0 for a base proposal by the integer program, the refined action is n = R(n0;Ψ) := f(n0,M(Eτ ◦ ΠB Ψ)).
      φ2
a3
4 Operators on Prime Hilbert States
a5φ5
a7
Example for n = 42
φ7
      Input Ψ(n0)
ΠB (Projection) Select Basis
Eτ (Collapse) Reduce Entropy
Hilbert Operator Pipeline
M (Measurement) Generate Refinement
Output n Fused Action
 2

5 Observer Ecology
5.1 Guilds, Coherence, and Phases
Observers are clustered into guilds by basis signatures B. Each guild maintains a phase vector φ ∈ [0, 1)M . After selection, the elite action n⋆ updates φ by exponential moving average
φp←(1−α)φp+α·n⋆ modp, ∀p∈P. p
Coherence is the mean pairwise Jaccard overlap of top-k supports across members’ Ψ.
     Resonance
Guild blue ObGseurviledr gErceoenlogy Guild red
Phase Sync
  Guilds by Basis B
5.2 Fitness
For an observer evaluated on budget B (accepted evaluations), define
A typical fitness is
2 1∑B
LZ(hb), Hint = mean internal entropy, coh = support-overlap within guild.
F = λ1LZ2 + λ2 max LZ(hb) + λ3coh + λ4(Hmax − Hint). b
LZ = B
b=1
6 General AI Applications
6.1 Combinatorial Optimization as Canonical Testbed
The environment S maps an action to (proxy score, true objective) via a two-stage evaluation. The sieve on the proxy cheaply rejects proposals before the costly full objective. Our operators reduce search entropy and synchronize guilds toward productive residue classes.
3

  Hilber
n0
(Base Proposal)
 t Refine (Π, E, M)
  Two-Stage Evaluation
 n (Refined Action)
   Quick Check
Proxy Eval Proxy Score
    If Pass
 Final Score
  Full Eval Objective Score
6.2 Broader Generalization
For combinatorial optimization, replace (proxy, objective) with (cheap heuristic, true cost). For few-shot inference, treat tokens or program sketches as actions; Π selects a semantic basis, E focuses hypotheses, M commits to a concrete candidate.
7 Algorithms
Algorithm 1 HilbertRefine (per action)
Require: base n0, primes P, guild basis B, phase vector φ, collapse τ
1: Ψ←Embed(n0;P,φ)
2: Ψ←ΠB(Ψ);Ψ←Eτ(Ψ) 3: m←M(Ψ)
4: returnn←Fuse(n0,m)
Algorithm 2 EvolveEcology (per generation)
Require: population O, environments U, budgets B, phase-mix α
1: for all guilds G defined by basis signatures do
2: φ ← current phase vector for G
3: for all O ∈ G do
4: Propose n0; n ← HilbertRefine(n0,P,BG,φ,τ)
5: Evaluate on environments; accumulate (LZ2, Hint, coh)
6: end for
7: Select elite O⋆ with best fitness; let n⋆ be its best action
8: φ ← (1 − α)φ + αResidues(n⋆)
9: end for
10: Reproduce by elitism + mutation to form next generation
      4

8 Theory Sketches
Proposition 1 (Entropy Advantage of Two-Stage Evaluation). If the first-stage proxy rejects a constant fraction ρ of uniformly random actions at cost c1 ≪ c2 and correlates positively with the second-stage objective, then any observer that biases residues toward the acceptance manifold enjoys superlinear effective search-rate over an unbiased baseline, relative to c1 + c2.
Proposition 2 (Non-Local Phase Locking). Let φ update from elite residues with step α ∈ (0, 1]. If elites consistently arise from a subset B of prime channels, then φ converges in mean to a phase pattern that increases the probability mass of those channels for the population, raising coherence.
Phase φp
  p=3 p=2
p=5

Implementation Notes

Convergence via EMA
We provide three runnable builds: (i) guilds+dashboard, (ii) two-stage evaluator, and (iii) evalua- tor+Hilbert unified. Observers include: RES (resonant LCG with Hilbert refinement), CRT (Chinese- remainder bias), and a simple VM program. Metrics: LZ2, best LZ2, coherence, and Hilbert entropy Hh.
Complexity. Two-stage evaluation saves costly computations per proposal. Hilbert refinement adds O(M) overhead per proposal; M ≤ 100 suﬀices in practice. The ecology parallelizes trivially.
10 Applications
Search as Entropy Minimization. Any task with a cheap prefilter and expensive objective benefits from (Π, E, M): symbolic theorem proving, program synthesis, routing, scheduling.
AI Systems. Wrap LLM tool-use as observers: explorers maximize novelty, stabilizers lock to promising prime modes, switchers transfer phase patterns across tasks. Coherence acts as a structural regularizer across agents.
11 Limitations & Future Work
We do not prove global optimality; the ecology can mode-lock into suboptimal prime bases. Formal generalization bounds (PAC-Bayes over prime modes) and deeper analysis of the entropy–coherence trade-off are open. Engineering priorities: GPU/AVX accelerators, adaptive τ schedules, and broader benchmarks.
12 Conclusion
Modeling learning as an ecology of entropy-minimizing integer programs yields a practical, gradient-free approach that scales through non-local synchronization. Prime-indexed Hilbert operators supply the missing structure to focus search, share information, and lower entropy across agents and objectives. The framework is simple to implement, extensible, and validated on discrete optimization domains.
Code: notebooks and modules accompany this draft (two-stage evaluator, Hilbert operators, unified optimizer).

Generations
 
Acknowledgments
Gratitude to collaborators exploring resonance, primes, and observer ecologies.
References
[1] Information geometry and entropy methods. In the document Entropy, entropy is defined as an observer-relative measure: the uncertainty distribution across symbolic or prime eigenstates. Ob- servers are described as entropy pumps: collapsing internal entropy to achieve coherence while ex- porting entropy outward. This dual action is linked to gravity as informational curvature. In the Holographic Quantum Encoder, entropy collapse is implemented as a structured encoding: symbolic inputs are mapped into prime-based wavefunctions and evolve under entropy minimization, produc- ing holographic interference patterns that correspond to low-entropy attractor states. These works contribute the definition of entropy as both physical and symbolic, observer-relative and measurable, and establish its centrality as the driving force of system evolution.
[2] Integer programming and combinatorial search. In Quantum-Inspired Representations of Natural Numbers, integers are modeled as quantum-like superpositions of prime eigenstates. Operators such as the Prime Operator Pˆ, Number Operator Nˆ, and Factorization Operator Fˆ act on this Hilbert space to reveal the prime structure of numbers. Integer programs are then interpreted as entropy-minimizing processes: each candidate solution is refined by projection, entropy collapse, and measurement- to-action operators. In the Model document, this is expanded into a computational architecture: integer programs form the basis of observers that propose actions, evaluate entropy, and evolve under ecological selection. Together, these works contribute a formal bridge between number theory, combinatorial optimization, and AI search framed as ecological entropy minimization.
[3] Objective functions and two-stage optimization. In Non-Local Prime Communication, objective eval- uation is interpreted as resonance filtering: the proxy acts as a sieve that removes high-entropy proposals, while the full objective completes the collapse into a deterministic output. Two-stage optimization—precomputing fixed components—is understood as fixing a resonance manifold: once set, all proposal searches explore that fixed resonance landscape. In the Quantum Information Systems Using Prime Number Wave Functions, this insight is generalized: wavefunctions seeded by primes act as global resonance filters, shaping which symbolic or computational states survive collapse. These works demonstrate that objective evaluation itself can be reframed as an entropy minimization dynamic operating over prime-structured state spaces.
[4] Evolutionary and ecological computation. In the Quantum Consciousness Resonator, observer pro- grams are embedded in distributed ecologies: populations of integer programs evolve together, cou- pled by resonance through prime eigenstates. The Condensed Quantum Formalism develops the mathematics of this ecology as a Lindblad-like entropy evolution, with observer-dependent collapse rates set by symbolic resonance. In the Unified framework, these ideas are extended to physics and cosmology: observer ecologies are shown to form nested coherence manifolds whose stabilizations correspond to gravitational and cosmological structure. Collectively, these works contribute the eco- logical view of computation: that learning systems should be built not as isolated optimizers, but as synchronizing populations of entropy-minimizing integer programs, converging toward coherence by resonance.

Why this model suits trading
	•	Discrete actions & latency: Position, size, and route selections are inherently discrete; Π→E→M turns noisy scores into focused, executable integers under latency budgets.  ￼  ￼
	•	Two-stage evaluation = “quick sim then P&L”: Use cheap proxies (slippage-aware edge, microstructure filters) before expensive objective (live fill/P&L). That directly matches your sieve theorem and yields real-time proposal throughput.  ￼
	•	Observer ecologies: Guilds specialized by prime bases act like an ensemble of regime specialists that phase-lock when a regime persists and decohere when it shifts. Great for FX/crypto session changes and equities open/close dynamics.  ￼
	•	Entropy as focus: Eτ is a principled way to shrink hypothesis mass when markets trend, then relax τ to re-explore when chop returns.  ￼
	•	Non-local synchronization: Phase vectors let you propagate “what’s working” across symbols and horizons without raw parameter sharing—handy for multi-asset co-moves.  ￼

Trading-RL mapping (wireframe)

State (per observer)
	•	Market snapshot: returns, volatility, order-book features, regime tags.
	•	Internal features: recent action residues mod primes P, guild phase φ, local entropy H.  ￼

Action (integer n)
	•	Encodes tuple (side, size bucket, venue/route, time-in-force, bracket ID) packed into 32 bits. M maps (a_p, φ_p) → refinement bits m that fuse with a base proposal n₀.  ￼

Reward (two-stage)
	•	Proxy r₁ (fast): edge × pass filters − impact estimate.
	•	Objective r₂ (slow): slippage-adjusted P&L − risk costs − inventory penalty; include drawdown convexity. Use r = λ r₁ + (1−λ) r₂ with λ shrinking as confidence grows.  ￼

Operators in loop
	1.	Embed n₀ → Ψ; 2) Π_B selects prime basis for the guild; 3) E_τ collapses entropy to focus; 4) M emits refinement bits; 5) Fuse → n; 6) Execute via broker.  ￼  ￼

Ecology dynamics
	•	Guilds share φ (EMA of elite residues) so winning residues bias new proposals; coherence becomes a regularizer.  ￼
	•	Cross-asset non-local cues: limited φ-sharing graph so BTC regime can “ping” ETH/XMR; majors can “ping” minors.  ￼

Risk & execution layer (must-haves)
	•	Hard guards: max position, notional, per-minute loss, inventory bounds, kill-switch.
	•	Action filter before route: reject orders violating liquidity/fee/latency constraints.
	•	Venue adapter: supports IOC/FOK, post-only, smart child orders.
	•	Clock discipline: sub-second bars for MEXC/crypto, millisecond event queue for FX top-of-book.

Training/evaluation protocol
	•	Walk-forward: retrain/refresh φ and τ on rolling windows; never peek.
	•	Ablations: baseline PPO/SAC vs. Π-only vs. Π+E vs. Π+E+M; ecology vs. single agent.
	•	Metrics: Sharpe/Sortino, hit-rate, average adverse excursion, tail P&L, turnover, fill-ratio, latency P50/P99, stability of φ and H over time.
	•	Cross-market validation: crypto (24/7), FX (sessions), liquid equities (auction shocks).
	•	Live trial: paper → micro-notional → ramp with risk caps and session-bound exposure.

Practical design (concise)
	•	Prime set P: 16–64 primes; bind guilds to subsets by symbol/horizon (e.g., BTC-5s uses {2,3,5,7,11,13}).  ￼
	•	E_τ schedule: cosine/entropy-feedback—tighten in trend, loosen in mean-reversion spikes.  ￼
	•	Two-stage evaluator: r₁ uses microstructure/queue-position simulators; r₂ uses async account fills.  ￼
	•	Knowledge sharing: broadcast only φ deltas and basis signatures—no raw P&L. Non-local, low-bandwidth.  ￼
	•	Symbol routing policy: M can reserve bits for venue selection and child-order style; refine without retraining the whole observer.  ￼

Minimal MVP (two weeks of focused build, small capital trial)
	1.	Implement Π/E/M and HilbertRefine() exactly as your Algo 1.  ￼
	2.	Wire a two-stage backtester (crypto first): fast proxy + async fill sim.  ￼
	3.	One ecology: 3 guilds × 8 observers each; BTCUSDT 1s bars; actions: {flat, ±1, ±2, ±3 units} × {market, passive}.
	4.	Risk shell + logging of φ, H(Ψ), coherence, and residue histograms every epoch.
	5.	Compare to PPO on same feature set.

Extensions once MVP is green
	•	Holographic features: HQE-style holographic intensity of symbol baskets as regime features (cheap, cached), fed into base proposals n₀.  ￼
	•	Semantic coupling: lightweight H_G bias between correlated symbols to stabilize during news shocks.  ￼  ￼
	•	Prime-routed portfolios: assign disjoint prime subsets to non-overlapping risk buckets to reduce crowding.  ￼

Pitfalls & how your framework addresses them
	•	Non-stationarity: φ updates + τ schedules adapt faster than re-estimating gradients.  ￼
	•	Sparse good trades: E_τ keeps the search tight around productive residue classes; two-stage saves budget.  ￼
	•	Mode-lock risk: periodically inject basis mutations; rotate small chunks of P to test nearby classes.  ￼
	•	Overfitting: cross-venue, cross-symbol walk-forward and entropy/coherence stability checks.  ￼

Tiny code sketch (pseudocode)

for obs in guild:
    n0 = obs.base_policy(x_t)
    Ψ  = embed(n0, P, ϕ)
    Ψ  = Eτ( Π_B(Ψ) )
    m  = M(Ψ)
    n  = fuse(n0, m)
    r1 = fast_proxy(n, book)
    if pass_proxy(r1): r2 = async_fill_pnl(n)
    obs.update(F=fitness(r1,r2,coh,H_int))
G_elite = select_elite(guild); ϕ = ema_phase_update(ϕ, residues(G_elite.n_star))

Bottom line: viable and well-matched. Π/E/M + ecologies give you a structured, latency-aware RL that learns to bias into favorable residue classes and synchronize what works across agents—exactly what a live trading stack needs.

0) Tech stack (suggested)
	•	Lang: TypeScript (node) for live I/O + Python for RL/ecology (optional to do all in TS).
	•	Runtime: Node 20+, uvloop/asyncio if Python.
	•	Storage: Parquet (features, fills), SQLite/duckdb for quick analytics.
	•	Messaging: In-proc event bus (simple pub/sub), or Redis streams if you want multi-proc.

⸻

1) Core data model

1.1 Market data (1-second bars)

// topic: md.btcusdt.1s
{
  "ts": 1735123456000,        // ms epoch (close of bar)
  "o": 100000.0,
  "h": 100050.5,
  "l": 99990.0,
  "c": 100020.0,
  "v": 12.345,                // base asset volume
  "tks": 4321,                // trades count (optional)
  "ob": { "ba": 100019.5, "bb": 100018.8, "ba_sz": 3.1, "bb_sz": 3.4 } // optional: last snapshot
}

1.2 Feature frame (derived)

// topic: feat.btcusdt.1s
{
  "ts": 1735123456000,
  "ret_1s": 0.0002,
  "ret_5s": -0.0001,
  "vol_30s": 0.0018,           // realized volatility (EWMA)
  "kurt_60s": 3.4,
  "imb_1s": 0.12,              // orderbook imbalance if available
  "regime": "trend|chop|shock",// simple HMM/threshold tag
  "hqe_basket": 0.76           // optional holographic intensity feature
}

1.3 Action encoding (32-bit)

We pack trade intent into a uint32. Layout (LSB→MSB):
	•	bits 0–1: side (00 flat, 01 long, 10 short, 11 hold)
	•	bits 2–4: size bucket (0…7 → map to notional or units)
	•	bits 5–6: order type (00 market, 01 post-only, 10 IOC)
	•	bits 7–9: time-in-force bucket
	•	bits 10–13: bracket profile (TP/SL preset id)
	•	bits 14–31: free (refinement bits m from M)

Represented in JSON for logs:

{
  "n": 1234567890, 
  "decoded": { "side":"long", "size":2, "ord":"market", "tif":1, "bracket":3, "m": 0x2AF31 }
}

1.4 Orders, fills, positions

// order
{
  "oid": "uuid",
  "ts": 1735123456789,
  "symbol": "BTCUSDT",
  "px": 100020.0,
  "qty": 0.01,
  "side": "buy|sell",
  "type": "market|limit|ioc",
  "tif": "GTC|IOC|PO",
  "meta": { "action_n": 1234567890 }
}

// fill
{
  "fid": "uuid",
  "oid": "uuid",
  "ts": 1735123457000,
  "px": 100019.8,
  "qty": 0.01,
  "fee": 0.02,
  "liquidity": "maker|taker"
}

// position snapshot (per bar)
{
  "ts": 1735123457000,
  "qty": 0.02,
  "avg_px": 100015.4,
  "unreal": 0.42,
  "real": 12.30,
  "drawdown": 0.8
}


⸻

2) Interfaces

2.1 Feature pipeline

interface FeatureEngine {
  update(bar: Bar1s): FeatureFrame | null;         // returns on completed bar
}

2.2 Observer & guild

type Prime = number;               // a prime in P
type PhaseVec = Record<Prime, number>; // φ_p in [0,1)

interface Observer {
  id: string;
  state: Int32Array;               // internal counters etc.
  base_proposal(x: FeatureFrame): number;      // n0 (uint32)
  embed(n0: number, P: Prime[], phi: PhaseVec): HilbertState;
  project(h: HilbertState, B: Prime[]): HilbertState; // Π_B
  collapse(h: HilbertState, tau: number): HilbertState; // E_τ
  measure(h: HilbertState): number;            // m (refinement bits)
  fuse(n0: number, m: number): number;         // final n
}

interface Guild {
  id: string;
  basis: Prime[];                   // B ⊆ P
  phi: PhaseVec;                    // shared
  observers: Observer[];
}

2.3 Two-stage evaluator

interface Evaluator {
  proxy(n: number, book: BookState, feat: FeatureFrame): ProxyResult;  // fast
  objective(exec: ExecutionResult): ObjectiveResult;                    // slow (fills)
}

2.4 Risk & execution (paper)

interface RiskEngine {
  precheck(n: number, pos: Position, feat: FeatureFrame): boolean; // guardrails
  limits: { maxNotional: number, maxInv: number, perMinLoss: number };
}

interface PaperBroker {
  route(n: number, bar: Bar1s, book?: BookState): ExecutionResult; // slippage model
}


⸻

3) Operators (Π, E, M) — minimal definitions

3.1 Embedding

For prime set P = {2,3,5,7,11,13,17,19,23,29,31}, map integer n0 to:
	•	Amplitude: a_p = norm(1 − (n0 mod p)/p)
	•	Phase: φ̂_p = 2π * (n0 mod p)/p + 2π * φ_p  where φ_p ∈ [0,1) is the guild phase.

type HilbertState = { amps: Record<Prime, number>, phases: Record<Prime, number> };

3.2 Projection Π_B

Keep channels in B, renormalize amplitudes s.t. Σ_p a_p = 1.

3.3 Entropy-collapse E_τ

Soft top-k: sort channels by a_p, retain minimal set whose Shannon entropy H = -Σ w_p log2 w_p ≤ τ; shrink others by factor γ (e.g., 0.2) and renormalize.

3.4 Measurement-to-action M

Deterministic mixer from (a_p, φ̂_p) to refinement bits m:
	•	Compute vector v = [a_p * cos φ̂_p] ⊕ [a_p * sin φ̂_p] over B.
	•	Hash v with a fast integer hash (e.g., splitmix64) → take lower 18 bits as m.
	•	fuse(n0,m): set bits 14–31 of n0 to m.

⸻

4) Ecology loop (per 1-s bar)

for (const guild of guilds) {
  const { basis: B, phi } = guild;
  for (const obs of guild.observers) {
    const n0 = obs.base_proposal(feat);
    let Ψ = obs.embed(n0, P, phi);
    Ψ = obs.project(Ψ, B);
    Ψ = obs.collapse(Ψ, tau);
    const m = obs.measure(Ψ);
    const n = obs.fuse(n0, m);

    if (!risk.precheck(n, position, feat)) continue;
    const proxy = evaluator.proxy(n, book, feat);
    if (!proxy.pass) continue;

    const exec = broker.route(n, bar, book);           // paper fills
    const obj  = evaluator.objective(exec);            // P&L update

    metrics.collect(obs.id, { proxy, obj, Ψ_entropy: entropy(Ψ), coherence: coh(guild) });
    fitness_bank.push(score(proxy, obj, guild, obs));
  }
  const elite = select_elite(fitness_bank, guild);
  guild.phi = ema_phase_update(guild.phi, residues(elite.n), alpha); // φ_p ← (1-α)φ_p + α*(elite mod p)/p
  mutate_population(guild); // small mutations to basis/signals
}


⸻

5) Two-stage evaluator (definitions)

5.1 Proxy (fast)
	•	Edge estimate: signed micro-alpha from features (e.g., edge = w·x from a tiny linear model).
	•	Impact cost: k * (qty / estDepth)^β.
	•	Queue pass: forbid crossing wide spreads or low depth.
	•	Decision: proxy.pass = (edge - impact) > θ_proxy.

5.2 Objective (slow)
	•	Mark fills at VWAP within the 1-s bar ± slippage model (taker → mid+½spread+impact; maker → mid−½spread; reject if not traded).
	•	Reward r₂: ΔP&L − fee − risk_costs − |inventory| * inv_penalty.
	•	Aggregate to running performance & drawdown.

⸻

6) Risk shell (hard guards)
	•	maxNotional: cap absolute notional exposure.
	•	maxInv: max absolute position (BTC).
	•	perMinLoss: rolling 60-s realized P&L floor (kill if breached).
	•	Block trading around detected shocks (e.g., spread > threshold, volatility spike).

⸻

7) Configuration

symbol: BTCUSDT
bar_interval: 1s
primes: [2,3,5,7,11,13,17,19,23,29,31]
guilds:
  - id: g-fast
    basis: [2,3,5,7,11]
    observers: 8
  - id: g-mid
    basis: [3,5,7,11,13,17]
    observers: 8
  - id: g-swing
    basis: [5,7,11,13,17,19,23]
    observers: 8
hilbert:
  tau: 1.5            # entropy cap (bits)
  collapse_gamma: 0.2
  alpha_phi: 0.15     # phase EMA
actions:
  size_buckets: [0.002, 0.005, 0.01, 0.02]   # BTC units
  tif_profiles: ["IOC","GTC","PO"]
  bracket_profiles:
    - { tp_bps: 10, sl_bps: 8 }
    - { tp_bps: 20, sl_bps: 12 }
risk:
  maxNotional: 1000
  maxInv: 0.03
  perMinLoss: -25
proxy:
  edge_threshold: 0.0
  impact_k: 0.5
  impact_beta: 0.6
backtest:
  start: 2025-08-01
  end: 2025-09-15


⸻

8) Metrics & logging
	•	Per-bar: P&L, position, turnover, fill ratio, slippage, φ summary (circular mean length), Hilbert entropy H(Ψ), guild coherence (Jaccard overlap of top-k supports).
	•	Per-epoch: Sharpe/Sortino, MAR, max DD, hit-rate, avg adverse excursion, latency P50/P99.
	•	Write to Parquet: bars.parq, features.parq, orders.parq, fills.parq, positions.parq, metrics.parq.

⸻

9) Training/evaluation regimen
	•	Walk-forward: train φ/τ schedules and base_proposal params on a rolling window (e.g., 14 days), validate on next 7 days; advance by 7 days.
	•	Ablations:
	•	baseline PPO on same features;
	•	Π only; Π+E; Π+E+M;
	•	single agent vs. 3-guild ecology.
	•	Significance: Reality-check with White’s Reality Check or SPA on strategy returns.

⸻

10) Minimal implementations

10.1 Base proposal (per observer)
	•	Start with a tiny linear scorer over features → sign(edge) chooses side, magnitude maps to size bucket; order type by regime (trend→market, chop→post-only). This gives you n0.

10.2 Paper broker slippage
	•	Taker: fill_px = mid + spread/2 + α * (qty / depth)^β.
	•	Maker: assume fill if bar range crosses limit; else expire.

10.3 Coherence
	•	Top-k by amplitude after collapse; Jaccard overlap averaged over observers in guild.

⸻

11) Runbook (MVP)
	1.	Data: load 1-s BTC bars (or stream from MEXC), compute features online.
	2.	Ecology: 3 guilds × 8 observers, P as above.
	3.	Loop: per bar → feature → observers propose (Π→E→M) → risk → proxy → paper fill → objective → log.
	4.	Phase update: per bar per guild from elite action residues.
	5.	Safety: halt on perMinLoss breach or extreme spread.
	6.	Output: daily Parquet, daily report with KPIs and residue/φ plots.

⸻

12) Stretch goals (after MVP is green)
	•	Adaptive τ schedule from realized entropy: tighten in low H regime, relax when H spikes.
	•	Cross-symbol φ graph (BTC→ETH) with small attenuation.
	•	Real order-book sim (queue modeling) for better maker behavior.
	•	Live micro-notional on exchange sandbox with the same interfaces.

