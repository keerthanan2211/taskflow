'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProject } from '@/hooks/use-projects';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { Field, Input, Textarea } from './ui/field';

const schema = z.object({
  name: z.string().trim().min(2, 'Give the project a name (at least 2 characters)').max(80),
  description: z.string().max(500, 'Keep it under 500 characters').optional(),
});
type Values = z.infer<typeof schema>;

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const create = useCreateProject();
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    const project = await create.mutateAsync({ name: values.name, description: values.description || undefined });
    reset();
    onClose();
    router.push(`/projects/${project.id}`);
  };

  return (
    <Dialog open={open} onClose={onClose} title="New project">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Project name" error={formState.errors.name?.message}>
          {(a11y) => <Input {...a11y} autoFocus placeholder="Website relaunch" {...register('name')} />}
        </Field>
        <Field label="Description (optional)" error={formState.errors.description?.message}>
          {(a11y) => <Textarea {...a11y} rows={3} {...register('description')} />}
        </Field>
        {create.error && (
          <p role="alert" className="text-sm text-danger">
            {create.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
