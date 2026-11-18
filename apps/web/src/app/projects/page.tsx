'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { PageMessage } from '@/components/ui/spinner';
import { useProjects } from '@/hooks/use-projects';
import { timeAgo } from '@/lib/format';

const roleLabel = { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Member' } as const;

function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="mt-1 text-sm text-muted">Every board you own or have been invited to.</p>
          </div>
          <Button onClick={() => setCreating(true)}>New project</Button>
        </div>

        {isLoading && <PageMessage>Loading projects…</PageMessage>}
        {error && <PageMessage>Projects could not be loaded: {error.message}</PageMessage>}

        {projects && projects.length === 0 && (
          <div className="mt-10 rounded-lg border border-dashed border-line px-6 py-14 text-center">
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-muted">Create a project to get a board with four columns, ready for tasks.</p>
            <Button className="mt-5" onClick={() => setCreating(true)}>
              Create your first project
            </Button>
          </div>
        )}

        {projects && projects.length > 0 && (
          <ul className="mt-8 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex flex-col gap-1 px-5 py-4 hover:bg-canvas sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    {p.description && <p className="truncate text-sm text-muted">{p.description}</p>}
                  </div>
                  <dl className="flex shrink-0 gap-5 text-sm text-muted">
                    <div>
                      <dt className="sr-only">Tasks</dt>
                      <dd>{p._count.tasks} tasks</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Members</dt>
                      <dd>{p._count.members} people</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Your role</dt>
                      <dd>{roleLabel[p.role]}</dd>
                    </div>
                    <div className="hidden w-20 text-right md:block">
                      <dt className="sr-only">Last updated</dt>
                      <dd>{timeAgo(p.updatedAt)}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <CreateProjectDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

export default function ProjectsPage() {
  return (
    <RequireAuth>
      <ProjectsList />
    </RequireAuth>
  );
}
