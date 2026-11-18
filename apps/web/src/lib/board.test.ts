import { describe, expect, it } from 'vitest';
import { findColumn, groupByStatus, moveTask } from './board';
import type { Task } from './types';

const task = (id: string, status: Task['status'], position: number): Task => ({
  id,
  projectId: 'p1',
  title: id,
  description: null,
  status,
  priority: 'MEDIUM',
  position,
  dueDate: null,
  assigneeId: null,
  createdById: 'u1',
  assignee: null,
  _count: { comments: 0 },
});

const tasks = [task('a', 'TODO', 2000), task('b', 'TODO', 1000), task('c', 'DONE', 1000)];

describe('groupByStatus', () => {
  it('puts tasks in their columns sorted by position', () => {
    const cols = groupByStatus(tasks);
    expect(cols.TODO.map((t) => t.id)).toEqual(['b', 'a']);
    expect(cols.DONE.map((t) => t.id)).toEqual(['c']);
    expect(cols.IN_PROGRESS).toEqual([]);
  });
});

describe('findColumn', () => {
  it('finds the column of a task or a column id', () => {
    const cols = groupByStatus(tasks);
    expect(findColumn(cols, 'c')).toBe('DONE');
    expect(findColumn(cols, 'IN_REVIEW')).toBe('IN_REVIEW');
    expect(findColumn(cols, 'missing')).toBeNull();
  });
});

describe('moveTask', () => {
  it('moves a task across columns at the given index', () => {
    const cols = moveTask(groupByStatus(tasks), 'a', 'DONE', 0);
    expect(cols.TODO.map((t) => t.id)).toEqual(['b']);
    expect(cols.DONE.map((t) => t.id)).toEqual(['a', 'c']);
    expect(cols.DONE[0].status).toBe('DONE');
  });

  it('reorders inside the same column', () => {
    const cols = moveTask(groupByStatus(tasks), 'a', 'TODO', 0);
    expect(cols.TODO.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('does not mutate the input', () => {
    const before = groupByStatus(tasks);
    moveTask(before, 'a', 'DONE', 0);
    expect(before.TODO.map((t) => t.id)).toEqual(['b', 'a']);
  });
});
