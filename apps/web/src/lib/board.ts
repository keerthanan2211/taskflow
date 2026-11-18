import type { Task, TaskStatus } from './types';
import { STATUSES } from './types';

export type Columns = Record<TaskStatus, Task[]>;

/** Groups tasks into the four board columns, each sorted by position. */
export function groupByStatus(tasks: Task[]): Columns {
  const columns = Object.fromEntries(STATUSES.map((s) => [s.id, [] as Task[]])) as Columns;
  for (const task of tasks) columns[task.status].push(task);
  for (const s of STATUSES) columns[s.id].sort((a, b) => a.position - b.position);
  return columns;
}

/** Finds which column a task (or a column id used as a drop target) belongs to. */
export function findColumn(columns: Columns, id: string): TaskStatus | null {
  if (id in columns) return id as TaskStatus;
  for (const s of STATUSES) {
    if (columns[s.id].some((t) => t.id === id)) return s.id;
  }
  return null;
}

/**
 * Moves a task to `toIndex` in column `to`, returning new columns (pure, no mutation).
 * Used for the optimistic UI update while the API call is in flight.
 */
export function moveTask(columns: Columns, taskId: string, to: TaskStatus, toIndex: number): Columns {
  const from = findColumn(columns, taskId);
  if (!from) return columns;

  const task = columns[from].find((t) => t.id === taskId)!;
  const next: Columns = { ...columns, [from]: columns[from].filter((t) => t.id !== taskId) };
  const target = [...next[to]];
  const index = Math.max(0, Math.min(toIndex, target.length));
  target.splice(index, 0, { ...task, status: to });
  next[to] = target;
  return next;
}

export function flatten(columns: Columns): Task[] {
  return STATUSES.flatMap((s) => columns[s.id]);
}
