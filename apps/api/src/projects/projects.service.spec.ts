import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { ProjectsService } from './projects.service';

describe('ProjectsService.assertMember', () => {
  const findUnique = jest.fn();
  const prisma = { projectMember: { findUnique } } as any;
  const service = new ProjectsService(prisma);

  beforeEach(() => findUnique.mockReset());

  it('returns the membership for a member', async () => {
    findUnique.mockResolvedValue({ projectId: 'p1', userId: 'u1', role: ProjectRole.MEMBER });
    await expect(service.assertMember('p1', 'u1')).resolves.toMatchObject({ role: ProjectRole.MEMBER });
  });

  it('hides projects from non-members with a 404', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.assertMember('p1', 'stranger')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects members without the required role', async () => {
    findUnique.mockResolvedValue({ projectId: 'p1', userId: 'u1', role: ProjectRole.MEMBER });
    await expect(service.assertMember('p1', 'u1', [ProjectRole.OWNER])).rejects.toBeInstanceOf(ForbiddenException);
  });
});
