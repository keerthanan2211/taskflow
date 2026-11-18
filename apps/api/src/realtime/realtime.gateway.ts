import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ProjectsService } from '../projects/projects.service';

export type BoardEvent = 'task.created' | 'task.updated' | 'task.deleted' | 'comment.created';

const room = (projectId: string) => `project:${projectId}`;

/**
 * Pushes board changes to everyone viewing the same project.
 * Clients authenticate with their JWT in the handshake and may only join rooms
 * for projects they are a member of.
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','), credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly auth: AuthService,
    private readonly projects: ProjectsService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('missing token');
      client.data.userId = this.auth.verifyToken(token).sub;
    } catch {
      this.logger.debug(`Rejected socket ${client.id}: invalid token`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('project.join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    try {
      await this.projects.assertMember(projectId, client.data.userId);
      await client.join(room(projectId));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage('project.leave')
  async leave(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    await client.leave(room(projectId));
    return { ok: true };
  }

  emit(projectId: string, event: BoardEvent, payload: unknown, actorId: string): void {
    this.server?.to(room(projectId)).emit(event, { payload, actorId });
  }
}
