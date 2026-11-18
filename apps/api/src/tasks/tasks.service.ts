import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/public-user';
import { MANAGERS, ProjectsService } from '../projects/projects.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';
import { evenPositions, needsRebalance, positionBetween } from './position';

const taskInclude = {
  assignee: { select: publicUserSelect },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(projectId: string, userId: string) {
    await this.projects.assertMember(projectId, userId);
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      include: taskInclude,
    });
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    await this.projects.assertMember(projectId, userId);
    if (dto.assigneeId) await this.assertAssignable(projectId, dto.assigneeId);

    const status = dto.status ?? TaskStatus.TODO;
    const last = await this.prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title: dto.title.trim(),
        description: dto.description,
        status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
        createdById: userId,
        position: positionBetween(last?.position, undefined),
      },
      include: taskInclude,
    });
    await this.touchProject(projectId);
    this.realtime.emit(projectId, 'task.created', task, userId);
    return task;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    const existing = await this.getTaskForMember(taskId, userId);
    if (dto.assigneeId) await this.assertAssignable(existing.projectId, dto.assigneeId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate === null ? null : new Date(dto.dueDate),
        assigneeId: dto.assigneeId,
      },
      include: taskInclude,
    });
    this.realtime.emit(existing.projectId, 'task.updated', task, userId);
    return task;
  }

  /** Moves a task to `index` within the `status` column (drag and drop). */
  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const existing = await this.getTaskForMember(taskId, userId);

    const task = await this.prisma.$transaction(async (tx) => {
      let column = await tx.task.findMany({
        where: { projectId: existing.projectId, status: dto.status, NOT: { id: taskId } },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });

      const index = Math.min(dto.index, column.length);
      let before = column[index - 1]?.position;
      let after = column[index]?.position;

      if (needsRebalance(before, after)) {
        const positions = evenPositions(column.length);
        await Promise.all(
          column.map((t, i) => tx.task.update({ where: { id: t.id }, data: { position: positions[i] } })),
        );
        column = column.map((t, i) => ({ ...t, position: positions[i] }));
        before = column[index - 1]?.position;
        after = column[index]?.position;
      }

      return tx.task.update({
        where: { id: taskId },
        data: { status: dto.status, position: positionBetween(before, after) },
        include: taskInclude,
      });
    });

    this.realtime.emit(existing.projectId, 'task.updated', task, userId);
    return task;
  }

  async remove(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    const member = await this.projects.assertMember(task.projectId, userId);

    // Managers can delete anything; members can only delete tasks they created
    if (!MANAGERS.includes(member.role) && task.createdById !== userId) {
      throw new ForbiddenException('Only the task creator or a project admin can delete this task');
    }
    await this.prisma.task.delete({ where: { id: taskId } });
    this.realtime.emit(task.projectId, 'task.deleted', { id: taskId }, userId);
    return { id: taskId };
  }

  async getTaskForMember(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.projects.assertMember(task.projectId, userId);
    return task;
  }

  private async assertAssignable(projectId: string, assigneeId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!member) throw new BadRequestException('Tasks can only be assigned to project members');
  }

  private touchProject(projectId: string) {
    return this.prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } });
  }
}
