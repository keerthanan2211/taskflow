/**
 * Seeds a demo workspace so the app has realistic data on first run.
 * Login: demo@taskflow.dev / Demo#2026
 */
import { PrismaClient, ProjectRole, TaskPriority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo#2026', 12);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@taskflow.dev' },
    update: {},
    create: { email: 'demo@taskflow.dev', name: 'Demo User', passwordHash },
  });
  const priya = await prisma.user.upsert({
    where: { email: 'priya@taskflow.dev' },
    update: {},
    create: { email: 'priya@taskflow.dev', name: 'Priya Raman', passwordHash },
  });
  const arjun = await prisma.user.upsert({
    where: { email: 'arjun@taskflow.dev' },
    update: {},
    create: { email: 'arjun@taskflow.dev', name: 'Arjun Mehta', passwordHash },
  });

  const existing = await prisma.project.findFirst({ where: { name: 'Website relaunch', members: { some: { userId: demo.id } } } });
  if (existing) {
    console.log('Seed data already present, skipping.');
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: 'Website relaunch',
      description: 'Redesign and rebuild the marketing site on Next.js.',
      members: {
        create: [
          { userId: demo.id, role: ProjectRole.OWNER },
          { userId: priya.id, role: ProjectRole.ADMIN },
          { userId: arjun.id, role: ProjectRole.MEMBER },
        ],
      },
    },
  });

  const tasks: Array<[string, TaskStatus, TaskPriority, string | null]> = [
    ['Audit current site performance', TaskStatus.DONE, TaskPriority.HIGH, demo.id],
    ['Finalize homepage design in Figma', TaskStatus.DONE, TaskPriority.MEDIUM, priya.id],
    ['Build responsive header and navigation', TaskStatus.IN_REVIEW, TaskPriority.HIGH, demo.id],
    ['Set up CMS content models', TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, arjun.id],
    ['Implement pricing page', TaskStatus.IN_PROGRESS, TaskPriority.URGENT, demo.id],
    ['Write contact form with validation', TaskStatus.TODO, TaskPriority.MEDIUM, null],
    ['Add Open Graph images', TaskStatus.TODO, TaskPriority.LOW, priya.id],
    ['Lighthouse pass on mobile', TaskStatus.TODO, TaskPriority.HIGH, null],
  ];

  const counters: Record<string, number> = {};
  for (const [title, status, priority, assigneeId] of tasks) {
    counters[status] = (counters[status] ?? 0) + 1000;
    await prisma.task.create({
      data: { projectId: project.id, title, status, priority, assigneeId, createdById: demo.id, position: counters[status] },
    });
  }

  console.log('Seeded demo workspace. Log in with demo@taskflow.dev / Demo#2026');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
