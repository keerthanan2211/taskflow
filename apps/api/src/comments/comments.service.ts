import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/public-user';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { TasksService } from '../tasks/tasks.service';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(taskId: string, userId: string) {
    await this.tasks.getTaskForMember(taskId, userId);
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: publicUserSelect } },
    });
  }

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.tasks.getTaskForMember(taskId, userId);
    const comment = await this.prisma.comment.create({
      data: { taskId, authorId: userId, body: dto.body.trim() },
      include: { author: { select: publicUserSelect } },
    });
    this.realtime.emit(task.projectId, 'comment.created', comment, userId);
    return comment;
  }
}
