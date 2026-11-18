import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMember, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/public-user';
import { AddMemberDto, CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

export const MANAGERS: ProjectRole[] = [ProjectRole.OWNER, ProjectRole.ADMIN];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Central authorization check. Every project-scoped action goes through here, so a user
   * can never read or change a project they don't belong to.
   */
  async assertMember(projectId: string, userId: string, roles?: ProjectRole[]): Promise<ProjectMember> {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    // 404 rather than 403 so non-members can't probe which project IDs exist
    if (!member) throw new NotFoundException('Project not found');
    if (roles && !roles.includes(member.role)) {
      throw new ForbiddenException('You do not have permission to do this');
    }
    return member;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      orderBy: { project: { updatedAt: 'desc' } },
      include: {
        project: { include: { _count: { select: { tasks: true, members: true } } } },
      },
    });
    return memberships.map(({ role, project }) => ({ ...project, role }));
  }

  create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        members: { create: { userId, role: ProjectRole.OWNER } },
      },
    });
  }

  async findOne(projectId: string, userId: string) {
    const member = await this.assertMember(projectId, userId);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        members: { include: { user: { select: publicUserSelect } }, orderBy: { joinedAt: 'asc' } },
      },
    });
    return { ...project, role: member.role };
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.assertMember(projectId, userId, MANAGERS);
    return this.prisma.project.update({ where: { id: projectId }, data: dto });
  }

  async remove(projectId: string, userId: string) {
    await this.assertMember(projectId, userId, [ProjectRole.OWNER]);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { id: projectId };
  }

  async addMember(projectId: string, userId: string, dto: AddMemberDto) {
    await this.assertMember(projectId, userId, MANAGERS);
    if (dto.role === ProjectRole.OWNER) throw new BadRequestException('A project can only have one owner');

    const invitee = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!invitee) throw new NotFoundException('No TaskFlow account uses that email yet');

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invitee.id } },
    });
    if (existing) throw new ConflictException('That person is already on this project');

    return this.prisma.projectMember.create({
      data: { projectId, userId: invitee.id, role: dto.role ?? ProjectRole.MEMBER },
      include: { user: { select: publicUserSelect } },
    });
  }

  async removeMember(projectId: string, userId: string, memberId: string) {
    await this.assertMember(projectId, userId, MANAGERS);
    const target = await this.assertMember(projectId, memberId);
    if (target.role === ProjectRole.OWNER) throw new BadRequestException('The project owner cannot be removed');

    await this.prisma.$transaction([
      // Unassign their open tasks so nothing points at someone who can no longer see the board
      this.prisma.task.updateMany({ where: { projectId, assigneeId: memberId }, data: { assigneeId: null } }),
      this.prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId: memberId } } }),
    ]);
    return { userId: memberId };
  }
}
