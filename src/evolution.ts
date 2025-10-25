import { Observer, BaseObserver } from './observer.js';
import { Guild } from './guild.js';
import { Prime } from './types.js';

/**
 * Elite selection: choose best N observers by fitness
 */
export interface EliteSelection {
  observer: Observer;
  fitness: number;
  actionStar: number; // n⋆ - the best action from this observer
}

export function selectElite(
  observers: Observer[],
  fitnessScores: Map<string, number>,
  topN = 1
): EliteSelection[] {
  const ranked = observers
    .map(obs => ({
      observer: obs,
      fitness: fitnessScores.get(obs.id) ?? 0,
      actionStar: 0 // placeholder, should be tracked during evaluation
    }))
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, topN);
  
  return ranked;
}

/**
 * Mutate observer state or parameters
 * Simple mutation: flip random bits in internal state
 */
export function mutateObserver(obs: Observer, mutationRate = 0.1): Observer {
  const mutated = new BaseObserver(`${obs.id}-m`);
  mutated.state.set(obs.state);
  
  // Mutate internal state with probability mutationRate
  for (let i = 0; i < mutated.state.length; i++) {
    if (Math.random() < mutationRate) {
      mutated.state[i] = (mutated.state[i] + (Math.random() < 0.5 ? 1 : -1)) | 0;
    }
  }
  
  return mutated;
}

/**
 * Reproduce population for next generation
 * Uses elitism + mutation strategy per design.md section 7 (Algorithm 2, line 10)
 */
export function reproducePopulation(
  guild: Guild,
  elites: EliteSelection[],
  populationSize: number,
  eliteCount: number,
  mutationRate = 0.1
): Observer[] {
  const nextGen: Observer[] = [];
  
  // Keep elites
  for (let i = 0; i < Math.min(eliteCount, elites.length); i++) {
    nextGen.push(elites[i].observer);
  }
  
  // Fill rest with mutations of elites
  while (nextGen.length < populationSize) {
    const parent = elites[Math.floor(Math.random() * elites.length)].observer;
    nextGen.push(mutateObserver(parent, mutationRate));
  }
  
  return nextGen;
}

/**
 * Mutate guild basis (occasionally inject new prime combinations)
 * per design.md section "Pitfalls": periodically inject basis mutations
 */
export function mutateBasis(
  currentBasis: Prime[],
  allPrimes: Prime[],
  mutationProb = 0.05
): Prime[] {
  if (Math.random() > mutationProb) return currentBasis;
  
  // Swap one prime with a different one
  const idx = Math.floor(Math.random() * currentBasis.length);
  const available = allPrimes.filter(p => !currentBasis.includes(p));
  
  if (available.length === 0) return currentBasis;
  
  const newPrime = available[Math.floor(Math.random() * available.length)];
  const newBasis = [...currentBasis];
  newBasis[idx] = newPrime;
  
  return newBasis;
}
