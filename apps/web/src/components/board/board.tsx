'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMoveTask } from '@/hooks/use-board';
import { findColumn, groupByStatus, moveTask, type Columns } from '@/lib/board';
import { STATUSES, type Task } from '@/lib/types';
import { Column } from './column';
import { TaskCardBody } from './task-card';

const statusLabel = (id: string | null) => STATUSES.find((s) => s.id === id)?.label ?? 'the board';

export function Board({ projectId, tasks, onOpen }: { projectId: string; tasks: Task[]; onOpen: (task: Task) => void }) {
  const [columns, setColumns] = useState<Columns>(() => groupByStatus(tasks));
  const [activeId, setActiveId] = useState<string | null>(null);
  const move = useMoveTask(projectId);

  // Follow server data, except mid-drag, where local state leads so the card doesn't jump
  useEffect(() => {
    if (!activeId) setColumns(groupByStatus(tasks));
  }, [tasks, activeId]);

  const sensors = useSensors(
    // A small distance threshold keeps plain clicks working for opening a task
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space picks a card up; Enter is reserved for opening it
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId) ?? null, [tasks, activeId]);

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

  // Moving across columns while still dragging, so the target column opens a gap for the card
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findColumn(columns, String(active.id));
    const to = findColumn(columns, String(over.id));
    if (!from || !to || from === to) return;
    const overIndex = columns[to].findIndex((t) => t.id === over.id);
    setColumns((cols) => moveTask(cols, String(active.id), to, overIndex === -1 ? cols[to].length : overIndex));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    setActiveId(null);
    if (!over) {
      setColumns(groupByStatus(tasks));
      return;
    }

    const to = findColumn(columns, String(over.id));
    if (!to) return;
    const overIndex = columns[to].findIndex((t) => t.id === over.id);
    const index = overIndex === -1 ? columns[to].findIndex((t) => t.id === id) : overIndex;
    const finalIndex = index === -1 ? columns[to].length : index;

    const original = tasks.find((t) => t.id === id);
    const originalIndex = original ? groupByStatus(tasks)[original.status].findIndex((t) => t.id === id) : -1;
    if (original && original.status === to && originalIndex === finalIndex) return;

    setColumns((cols) => moveTask(cols, id, to, finalIndex));
    move.mutate({ id, status: to, index: finalIndex });
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over ${statusLabel(findColumn(columns, String(over.id)))}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${titleOf(active.id)} was moved to ${statusLabel(findColumn(columns, String(over.id)))}.`
        : `${titleOf(active.id)} was dropped back in place.`,
    onDragCancel: ({ active }) => `Move cancelled. ${titleOf(active.id)} returned to its column.`,
  };

  function titleOf(id: string | number) {
    return tasks.find((t) => t.id === id)?.title ?? 'Task';
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setColumns(groupByStatus(tasks));
      }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: 'Press Space to pick up a task. Use the arrow keys to move it, Space to drop, Escape to cancel.',
        },
      }}
    >
      {move.error && (
        <p role="alert" className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          That move could not be saved, so the card went back. {move.error.message}
        </p>
      )}
      <div className="flex snap-x gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        {STATUSES.map((s) => (
          <Column key={s.id} projectId={projectId} status={s.id} label={s.label} tasks={columns[s.id]} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCardBody task={activeTask} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
