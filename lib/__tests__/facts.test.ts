import { FACTS, CATEGORIES } from '../facts';

describe('facts database', () => {
  it('has at least 10 facts in every category', () => {
    for (const category of CATEGORIES) {
      const count = FACTS.filter((f) => f.category === category).length;
      expect(count).toBeGreaterThanOrEqual(10);
    }
  });

  it('has unique ids', () => {
    const ids = FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses known categories', () => {
    for (const fact of FACTS) {
      expect(CATEGORIES).toContain(fact.category);
    }
  });

  it('has non-empty text under 240 chars (notification-friendly)', () => {
    for (const fact of FACTS) {
      expect(fact.text.length).toBeGreaterThan(0);
      expect(fact.text.length).toBeLessThanOrEqual(240);
    }
  });
});
