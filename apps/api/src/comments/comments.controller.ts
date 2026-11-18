import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    return this.comments.list(taskId, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string, @Body() dto: CreateCommentDto) {
    return this.comments.create(taskId, user.id, dto);
  }
}
