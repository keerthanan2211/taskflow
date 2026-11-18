'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, json } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { flatten, groupByStatus, moveTask } from '@/lib/board';
import { getSocket } from '@/lib/socket';
import type { Comment, Task, TaskPriority, TaskStatus } from '@/lib/types';

export const taskKeys = {
  list: (projectId: string) => ['tasks', projectId] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
};

export interface TaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  status?: TaskStatus;
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: () => api<Task[]>(`/projects/${projectId}/tasks`),
  });
}

/**
 * Subscribes to live board events. Any change made by a teammate refreshes the board,
 * so everyone viewing the project sees the same state within a moment.
 */
export function useBoardRealtime(projectId: string) {
  const qc = useQueryClient();
  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    const join = () => socket.emit('project.join', projectId);
    join();
    socket.on('connect', join);

    const refreshTasks = () => qc.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    const onComment = ({ payload }: { payload: Comment }) => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(payload.taskId) });
      refreshTasks();
    };

    socket.on('task.created', refreshTasks);
    socket.on('task.updated', refreshTasks);
    socket.on('task.deleted', refreshTasks);
    socket.on('comment.created', onComment);

    return () => {
      socket.emit('project.leave', projectId);
      socket.off('connect', join);
      socket.off('task.created', refreshTasks);
      socket.off('task.updated', refreshTasks);
      socket.off('task.deleted', refreshTasks);
      socket.off('comment.created', onComment);
    };
  }, [projectId, token, qc]);
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskInput & { title: string }) =>
      api<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body: json(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.list(projectId) }),
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: TaskInput & { id: string }) =>
      api<Task>(`/tasks/${id}`, { method: 'PATCH', body: json(data) }),
    onSuccess: (task) =>
      qc.setQueryData<Task[]>(taskKeys.list(projectId), (old) => old?.map((t) => (t.id === task.id ? task : t))),
  });
}

/** Drag-and-drop move with an optimistic update: the card lands instantly, then the server confirms. */
export function useMoveTask(projectId: string) {
  const qc = useQueryClient();
  const key = taskKeys.list(projectId);

  return useMutation({
    mutationFn: ({ id, status, index }: { id: string; status: TaskStatus; index: number }) =>
      api<Task>(`/tasks/${id}/move`, { method: 'PATCH', body: json({ status, index }) }),
    onMutate: async ({ id, status, index }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Task[]>(key);
      if (previous) qc.setQueryData(key, flatten(moveTask(groupByStatus(previous), id, status, index)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: (_res, id) =>
      qc.setQueryData<Task[]>(taskKeys.list(projectId), (old) => old?.filter((t) => t.id !== id)),
  });
}

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.comments(taskId ?? ''),
    queryFn: () => api<Comment[]>(`/tasks/${taskId}/comments`),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api<Comment>(`/tasks/${taskId}/comments`, { method: 'POST', body: json({ body }) }),
    onSuccess: (comment) =>
      qc.setQueryData<Comment[]>(taskKeys.comments(taskId), (old) => [...(old ?? []), comment]),
  });
}
