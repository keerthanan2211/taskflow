'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { useCreateTask } from '@/hooks/use-board';
import type { Task, TaskStatus } from '@/lib/types';
import { SortableTaskCard } from './task-card';

const statusRule: Record<TaskStatus, string> = {
  TODO: 'border-t-status-todo',
  IN_PROGRESS: 'border-t-status-progress',
  IN_REVIEW: 'border-t-status-review',
  DONE: 'border-t-status-done',
};

interface ColumnProps {
  projectId: string;
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
}

export function Column({ projectId, status, label, tasks, onOpen }: ColumnProps) {
  // The list itself is a drop target, so empty columns still accept cards
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headingId = `column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className={clsx('flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-lg border-t-4 bg-line/40 sm:w-auto sm:max-w-none', statusRule[status])}
    >
      <header className="flex items-center justify-between px-3 pb-2 pt-3">
        <h2 id={headingId} className="text-sm font-semibold">
          {label}
        </h2>
        <span className="text-xs text-muted" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
      </header>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={clsx('flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2 transition-colors', isOver && 'bg-cobalt/5')}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpen} />
          ))}
          {tasks.length === 0 && (
            <li className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
              Drop a task here
            </li>
          )}
        </ul>
      </SortableContext>

      <QuickAdd projectId={projectId} status={status} label={label} />
    </section>
  );
}

function QuickAdd({ projectId, status, label }: { projectId: string; status: TaskStatus; label: string }) {
  const [title, setTitle] = useState('');
  const create = useCreateTask(projectId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    create.mutate({ title: trimmed, status }, { onSuccess: () => setTitle('') });
  };

  return (
    <form onSubmit={submit} className="px-2 pb-3">
      <label htmlFor={`add-${status}`} className="sr-only">
        Add a task to {label}
      </label>
      <input
        id={`add-${status}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        maxLength={140}
        disabled={create.isPending}
        className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm placeholder:text-muted hover:bg-surface focus:border-cobalt focus:bg-surface focus:outline-none"
      />
      {create.error && <p role="alert" className="mt-1 text-xs text-danger">{create.error.message}</p>}
    </form>
  );
}
