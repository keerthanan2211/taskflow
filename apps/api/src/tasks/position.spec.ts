import { evenPositions, needsRebalance, positionBetween, POSITION_STEP } from './position';

describe('positionBetween', () => {
  it('starts an empty column at the base step', () => {
    expect(positionBetween()).toBe(POSITION_STEP);
  });

  it('appends after the last task', () => {
    expect(positionBetween(3000, undefined)).toBe(4000);
  });

  it('prepends before the first task', () => {
    expect(positionBetween(undefined, 1000)).toBe(0);
  });

  it('places a task halfway between two neighbours', () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
  });

  it('keeps order stable across repeated inserts into the same gap', () => {
    let after = 2000;
    const before = 1000;
    for (let i = 0; i < 20; i++) {
      const p = positionBetween(before, after);
      expect(p).toBeGreaterThan(before);
      expect(p).toBeLessThan(after);
      after = p;
    }
  });
});

describe('needsRebalance', () => {
  it('is false for a healthy gap', () => {
    expect(needsRebalance(1000, 2000)).toBe(false);
  });

  it('is true once neighbours are almost touching', () => {
    expect(needsRebalance(1000, 1000 + 1e-9)).toBe(true);
  });

  it('is false at column edges', () => {
    expect(needsRebalance(undefined, 1000)).toBe(false);
  });
});

describe('evenPositions', () => {
  it('spreads positions evenly', () => {
    expect(evenPositions(3)).toEqual([1000, 2000, 3000]);
  });
});
