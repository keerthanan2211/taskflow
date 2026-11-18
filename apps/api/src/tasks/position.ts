/**
 * Fractional indexing helpers.
 *
 * Each task stores a floating-point `position`. To drop a task between two others we take the
 * midpoint of their positions, so a move only updates ONE row instead of renumbering the column.
 * When two neighbours get too close (after many moves into the same gap) we rebalance the column.
 */
export const POSITION_STEP = 1000;
export const MIN_GAP = 1e-6;

export function positionBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return POSITION_STEP;
  if (before === undefined) return (after as number) - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  return (before + after) / 2;
}

export function needsRebalance(before?: number, after?: number): boolean {
  return before !== undefined && after !== undefined && Math.abs(after - before) < MIN_GAP;
}

/** Evenly spaced positions for a column of `count` tasks: 1000, 2000, 3000 ... */
export function evenPositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_STEP);
}
