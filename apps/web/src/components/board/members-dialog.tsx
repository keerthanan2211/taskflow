'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddMember, useRemoveMember } from '@/hooks/use-projects';
import type { ProjectDetail } from '@/lib/types';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Field, Input, Select } from '../ui/field';

const schema = z.object({
  email: z.string().email('Enter the email address of a TaskFlow user'),
  role: z.enum(['ADMIN', 'MEMBER']),
});
type Values = z.infer<typeof schema>;

const roleLabel = { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Member' } as const;

export function MembersDialog({ project, open, onClose }: { project: ProjectDetail; open: boolean; onClose: () => void }) {
  const canManage = project.role !== 'MEMBER';
  const add = useAddMember(project.id);
  const remove = useRemoveMember(project.id);
  const { register, handleSubmit, reset, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const onSubmit = (values: Values) => add.mutate(values, { onSuccess: () => reset() });

  return (
    <Dialog open={open} onClose={onClose} title="People on this project">
      <ul className="divide-y divide-line">
        {project.members.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 py-2.5">
            <Avatar name={m.user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.user.name}</p>
              <p className="truncate text-xs text-muted">{m.user.email}</p>
            </div>
            <span className="text-xs text-muted">{roleLabel[m.role]}</span>
            {canManage && m.role !== 'OWNER' && (
              <Button
                variant="danger"
                className="h-8 px-2"
                onClick={() => remove.mutate(m.userId)}
                disabled={remove.isPending}
                aria-label={`Remove ${m.user.name}`}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>

      {canManage && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-medium">Add someone</h3>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Field label="Email" error={formState.errors.email?.message}>
              {(a11y) => <Input {...a11y} type="email" placeholder="teammate@example.com" {...register('email')} />}
            </Field>
            <Field label="Role">
              {(a11y) => (
                <Select {...a11y} {...register('role')}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              )}
            </Field>
          </div>
          {add.error && <p role="alert" className="text-sm text-danger">{add.error.message}</p>}
          {add.isSuccess && <p role="status" className="text-sm text-muted">Added to the project.</p>}
          <Button type="submit" disabled={add.isPending}>
            {add.isPending ? 'Adding…' : 'Add to project'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
