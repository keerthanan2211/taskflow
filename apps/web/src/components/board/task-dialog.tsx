'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddComment, useComments, useDeleteTask, useMoveTask, useUpdateTask } from '@/hooks/use-board';
import { useAuth } from '@/lib/auth-store';
import { timeAgo } from '@/lib/format';
import { PRIORITIES, STATUSES, type ProjectDetail, type Task, type TaskStatus } from '@/lib/types';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Field, Input, Select, Textarea } from '../ui/field';

const schema = z.object({
  title: z.string().trim().min(1, 'A task needs a title').max(140),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string(),
  dueDate: z.string(),
});
type Values = z.infer<typeof schema>;

const toValues = (task: Task): Values => ({
  title: task.title,
  description: task.description ?? '',
  priority: task.priority,
  assigneeId: task.assigneeId ?? '',
  dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
});

interface TaskDialogProps {
  task: Task | null;
  project: ProjectDetail;
  onClose: () => void;
}

export function TaskDialog({ task, project, onClose }: TaskDialogProps) {
  const userId = useAuth((s) => s.user?.id);
  const update = useUpdateTask(project.id);
  const move = useMoveTask(project.id);
  const remove = useDeleteTask(project.id);
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (task) reset(toValues(task));
  }, [task, reset]);

  if (!task) return <Dialog open={false} onClose={onClose} title="">{null}</Dialog>;

  const canDelete = project.role !== 'MEMBER' || task.createdById === userId;

  const onSubmit = (values: Values) =>
    update.mutate(
      {
        id: task.id,
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        assigneeId: values.assigneeId || null,
        dueDate: values.dueDate || null,
      },
      { onSuccess: () => reset(values) },
    );

  const changeStatus = (status: TaskStatus) =>
    // Moving from the dialog appends to the end of the chosen column: an alternative to dragging
    move.mutate({ id: task.id, status, index: Number.MAX_SAFE_INTEGER });

  const onDelete = () => {
    if (window.confirm(`Delete "${task.title}"? This also removes its comments.`)) {
      remove.mutate(task.id, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open onClose={onClose} title="Task details" wide>
      <div className="grid gap-8 md:grid-cols-[1fr_260px]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Title" error={formState.errors.title?.message}>
            {(a11y) => <Input {...a11y} {...register('title')} />}
          </Field>
          <Field label="Description">
            {(a11y) => <Textarea {...a11y} rows={5} placeholder="Add details, links or acceptance criteria" {...register('description')} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Priority">
              {(a11y) => (
                <Select {...a11y} {...register('priority')}>
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Assignee">
              {(a11y) => (
                <Select {...a11y} {...register('assigneeId')}>
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Due date">{(a11y) => <Input {...a11y} type="date" {...register('dueDate')} />}</Field>
          </div>

          {update.error && <p role="alert" className="text-sm text-danger">{update.error.message}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button type="submit" disabled={!formState.isDirty || update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            {update.isSuccess && !formState.isDirty && <span className="text-sm text-muted" role="status">Changes saved</span>}
            {canDelete && (
              <Button variant="danger" className="ml-auto" onClick={onDelete} disabled={remove.isPending}>
                Delete task
              </Button>
            )}
          </div>
        </form>

        <aside className="space-y-6">
          <Field label="Status">
            {(a11y) => (
              <Select {...a11y} value={task.status} onChange={(e) => changeStatus(e.target.value as TaskStatus)}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Comments taskId={task.id} />
        </aside>
      </div>
    </Dialog>
  );
}

function Comments({ taskId }: { taskId: string }) {
  const { data: comments, isLoading } = useComments(taskId);
  const add = useAddComment(taskId);
  const [body, setBody] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    add.mutate(body.trim(), { onSuccess: () => setBody('') });
  };

  return (
    <section aria-labelledby="comments-heading">
      <h3 id="comments-heading" className="text-sm font-medium">
        Comments
      </h3>
      <ol className="mt-3 max-h-64 space-y-3 overflow-y-auto" aria-live="polite">
        {isLoading && <li className="text-sm text-muted">Loading comments…</li>}
        {comments?.length === 0 && <li className="text-sm text-muted">No comments yet. Start the discussion.</li>}
        {comments?.map((c) => (
          <li key={c.id} className="flex gap-2">
            <Avatar name={c.author.name} />
            <div className="min-w-0">
              <p className="text-xs text-muted">
                <span className="font-medium text-ink">{c.author.name}</span> · {timeAgo(c.createdAt)}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <label htmlFor="new-comment" className="sr-only">
          Write a comment
        </label>
        <Textarea id="new-comment" rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment" maxLength={2000} />
        {add.error && <p role="alert" className="text-xs text-danger">{add.error.message}</p>}
        <Button type="submit" variant="secondary" disabled={add.isPending || !body.trim()}>
          Post comment
        </Button>
      </form>
    </section>
  );
}
