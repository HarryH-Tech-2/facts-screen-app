import { pickFacts, buildSchedule } from '../scheduler';
import type { Fact } from '../facts';

const makeFacts = (category: string, n: number): Fact[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${category}-${i + 1}`,
    category,
    text: `${category} fact ${i + 1}`,
  }));

const FACTS = [...makeFacts('Science', 5), ...makeFacts('Space', 5)];

describe('pickFacts', () => {
  it('only returns facts from enabled categories', () => {
    const picked = pickFacts(FACTS, ['Space'], 20);
    expect(picked.every((f) => f.category === 'Space')).toBe(true);
  });

  it('returns the requested count, cycling if the pool is small', () => {
    expect(pickFacts(FACTS, ['Science'], 12)).toHaveLength(12);
  });

  it('does not repeat a fact until the whole pool is used', () => {
    const picked = pickFacts(FACTS, ['Science', 'Space'], 10);
    expect(new Set(picked.map((f) => f.id)).size).toBe(10);
  });

  it('never starts with lastFactId when alternatives exist', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickFacts(FACTS, ['Science'], 5, 'Science-1');
      expect(picked[0].id).not.toBe('Science-1');
    }
  });

  it('returns empty array when no categories are enabled', () => {
    expect(pickFacts(FACTS, [], 10)).toEqual([]);
  });
});

describe('buildSchedule', () => {
  it('spaces facts by the interval starting one interval after startTime', () => {
    const facts = makeFacts('Science', 3);
    const start = new Date('2026-07-04T12:00:00Z');
    const schedule = buildSchedule(facts, 30, start);
    expect(schedule.map((s) => s.date.toISOString())).toEqual([
      '2026-07-04T12:30:00.000Z',
      '2026-07-04T13:00:00.000Z',
      '2026-07-04T13:30:00.000Z',
    ]);
    expect(schedule.map((s) => s.fact.id)).toEqual(['Science-1', 'Science-2', 'Science-3']);
  });
});
