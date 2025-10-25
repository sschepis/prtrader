import { describe, it, expect } from 'vitest';
import { selectElite, mutateObserver, reproducePopulation } from '../src/evolution.js';
import { BaseObserver } from '../src/observer.js';
import { createGuild } from '../src/guild.js';

describe('Evolution mechanisms', () => {
  it('selectElite returns top N observers by fitness', () => {
    const obs1 = new BaseObserver('obs1');
    const obs2 = new BaseObserver('obs2');
    const obs3 = new BaseObserver('obs3');
    
    const fitnessScores = new Map([
      ['obs1', 0.5],
      ['obs2', 0.9],
      ['obs3', 0.3]
    ]);
    
    const elites = selectElite([obs1, obs2, obs3], fitnessScores, 2);
    
    expect(elites.length).toBe(2);
    expect(elites[0].observer.id).toBe('obs2'); // highest fitness
    expect(elites[1].observer.id).toBe('obs1'); // second highest
  });

  it('mutateObserver creates a new observer with modified state', () => {
    const original = new BaseObserver('orig');
    original.state[0] = 42;
    original.state[1] = 100;
    
    const mutated = mutateObserver(original, 1.0); // 100% mutation rate
    
    expect(mutated.id).toContain('-m');
    // With 100% mutation rate, state should be different
    const isDifferent = Array.from(original.state).some((v, i) => v !== mutated.state[i]);
    expect(isDifferent).toBe(true);
  });

  it('reproducePopulation maintains population size with elites', () => {
    const guild = createGuild('test', [2, 3, 5], 5);
    
    const fitnessScores = new Map(
      guild.observers.map((obs, i) => [obs.id, i * 0.1])
    );
    
    const elites = selectElite(guild.observers, fitnessScores, 2);
    const nextGen = reproducePopulation(guild, elites, 5, 2, 0.1);
    
    expect(nextGen.length).toBe(5);
    // First 2 should be elites
    expect(nextGen[0].id).toBe(elites[0].observer.id);
    expect(nextGen[1].id).toBe(elites[1].observer.id);
  });
});
