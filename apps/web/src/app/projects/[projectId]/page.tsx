'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Board } from '@/components/board/board';
import { MembersDialog } from '@/components/board/members-dialog';
import { TaskDialog } from '@/components/board/task-dialog';
import { RequireAuth } from '@/components/require-auth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PageMessage } from '@/components/ui/spinner';
import { useBoardRealtime, useTasks } from '@/hooks/use-board';
import { useProject } from '@/hooks/use-projects';

function ProjectBoard({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const tasks = useTasks(projectId);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  useBoardRealtime(projectId);

  if (project.isLoading || tasks.isLoading) return <PageMessage>Loading board…</PageMessage>;
  if (project.error || !project.data) {
    return (
      <PageMessage>
        <span>
          This project doesn&apos;t exist or you don&apos;t have access.{' '}
          <Link href="/projects" className="text-cobalt hover:underline">
            Back to projects
          </Link>
        </span>
      </PageMessage>
    );
  }

  // Always read the open task from the latest data, so live updates show inside the dialog too
  const openTask = tasks.data?.find((t) => t.id === openTaskId) ?? null;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{project.data.name}</h1>
          {project.data.description && <p className="mt-0.5 truncate text-sm text-muted">{project.data.description}</p>}
        </div>
        <Button variant="secondary" onClick={() => setShowMembers(true)}>
          <span className="flex -space-x-1.5" aria-hidden>
            {project.data.members.slice(0, 4).map((m) => (
              <span key={m.userId} className="rounded-full ring-2 ring-surface">
                <Avatar name={m.user.name} />
              </span>
            ))}
          </span>
          {project.data.members.length} {project.data.members.length === 1 ? 'person' : 'people'}
        </Button>
      </div>

      <Board projectId={projectId} tasks={tasks.data ?? []} onOpen={(t) => setOpenTaskId(t.id)} />

      <TaskDialog task={openTask} project={project.data} onClose={() => setOpenTaskId(null)} />
      <MembersDialog project={project.data} open={showMembers} onClose={() => setShowMembers(false)} />
    </main>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <RequireAuth>
      <AppHeader>
        <Link href="/projects" className="text-sm text-muted hover:text-ink">
          All projects
        </Link>
      </AppHeader>
      <ProjectBoard projectId={projectId} />
    </RequireAuth>
  );
}
