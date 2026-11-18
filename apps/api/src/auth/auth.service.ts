import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/public-user';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email, name: dto.name.trim(), passwordHash },
      select: publicUserSelect,
    });
    return { user, accessToken: this.sign(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Same message for unknown email and wrong password, so attackers can't enumerate accounts
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: this.sign(user.id, user.email),
    };
  }

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
  }

  /** Used by the WebSocket gateway to authenticate socket handshakes. */
  verifyToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token);
  }

  private sign(sub: string, email: string): string {
    const payload: JwtPayload = { sub, email };
    return this.jwt.sign(payload);
  }
}
