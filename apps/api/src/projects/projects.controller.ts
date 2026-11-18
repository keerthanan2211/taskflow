import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { AddMemberDto, CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.projects.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Get(':projectId')
  findOne(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.projects.findOne(projectId, user.id);
  }

  @Patch(':projectId')
  update(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(projectId, user.id, dto);
  }

  @Delete(':projectId')
  remove(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.projects.remove(projectId, user.id);
  }

  @Post(':projectId/members')
  addMember(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: AddMemberDto) {
    return this.projects.addMember(projectId, user.id, dto);
  }

  @Delete(':projectId/members/:memberId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projects.removeMember(projectId, user.id, memberId);
  }
}
