import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('projects/:projectId/tasks')
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.tasks.list(projectId, user.id);
  }

  @Post('projects/:projectId/tasks')
  create(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.create(projectId, user.id, dto);
  }

  @Patch('tasks/:taskId')
  update(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(taskId, user.id, dto);
  }

  @Patch('tasks/:taskId/move')
  move(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string, @Body() dto: MoveTaskDto) {
    return this.tasks.move(taskId, user.id, dto);
  }

  @Delete('tasks/:taskId')
  remove(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    return this.tasks.remove(taskId, user.id);
  }
}
