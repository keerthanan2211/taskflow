'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { dueLabel } from '@/lib/format';
import { PRIORITIES, type Task } from '@/lib/types';
import { Avatar } from '../ui/avatar';

const priorityEdge = {
  LOW: 'before:bg-priority-low',
  MEDIUM: 'before:bg-priority-medium',
  HIGH: 'before:bg-priority-high',
  URGENT: 'before:bg-priority-urgent',
} as const;

export function TaskCardBody({ task, dragging }: { task: Task; dragging?: boolean }) {
  const due = dueLabel(task.dueDate);
  const priority = PRIORITIES.find((p) => p.id === task.priority)!.label;

  return (
    <div
      className={clsx(
        // The coloured left edge encodes priority, so the board can be scanned without reading labels
        'relative overflow-hidden rounded-md border border-line bg-surface py-2.5 pl-4 pr-3 text-left before:absolute before:inset-y-0 before:left-0 before:w-1',
        priorityEdge[task.priority],
        dragging && 'rotate-1 shadow-xl ring-1 ring-cobalt/40',
      )}
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
        <span className="sr-only">Priority: </span>
        <span>{priority}</span>
        {due && <span className={clsx(due.overdue && 'font-medium text-danger')}>{due.overdue ? `Overdue ${due.text}` : `Due ${due.text}`}</span>}
        {task._count.comments > 0 && (
          <span>
            {task._count.comments} {task._count.comments === 1 ? 'comment' : 'comments'}
          </span>
        )}
        <span className="ml-auto">{task.assignee ? <Avatar name={task.assignee.name} /> : <span>Unassigned</span>}</span>
      </div>
    </div>
  );
}

export function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('cursor-grab touch-manipulation rounded-md active:cursor-grabbing', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable task"
      aria-label={`${task.title}. Press Enter to open, Space to pick up and move.`}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === 'Enter' && !e.defaultPrevented) onOpen(task);
      }}
    >
      <TaskCardBody task={task} />
    </li>
  );
}
