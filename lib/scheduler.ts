import type { Fact } from './facts';

export interface ScheduledFact {
  fact: Fact;
  date: Date;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickFacts(
  facts: Fact[],
  enabledCategories: string[],
  count: number,
  lastFactId?: string
): Fact[] {
  const pool = facts.filter((f) => enabledCategories.includes(f.category));
  if (pool.length === 0) return [];

  const result: Fact[] = [];
  while (result.length < count) {
    const round = shuffle(pool);
    // Avoid repeating the previous fact (end of last round, or lastFactId).
    const previousId = result.length > 0 ? result[result.length - 1].id : lastFactId;
    if (round.length > 1 && previousId && round[0].id === previousId) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    result.push(...round);
  }
  return result.slice(0, count);
}

export function buildSchedule(
  facts: Fact[],
  intervalMinutes: number,
  startTime: Date
): ScheduledFact[] {
  return facts.map((fact, i) => ({
    fact,
    date: new Date(startTime.getTime() + (i + 1) * intervalMinutes * 60_000),
  }));
}
