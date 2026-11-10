import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Role } from '@prisma/client'
import { compare, hash } from 'bcryptjs'
import { presentUser } from '../common/presenters'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const username = dto.username.trim()
    const email = dto.email?.trim().toLowerCase() ?? null

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
      select: { id: true },
    })

    if (existing) {
      throw new ConflictException('用户名或邮箱已被使用')
    }

    const passwordHash = await hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: username,
      },
    })

    return this.issueToken(user)
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username.trim() },
    })

    if (!user) throw new UnauthorizedException('用户名或密码错误')

    const passwordMatched = await compare(dto.password, user.passwordHash)
    if (!passwordMatched) throw new UnauthorizedException('用户名或密码错误')

    return this.issueToken(user)
  }

  private async issueToken(user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    bio: string | null
    role: Role
    createdAt: Date
  }) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      accessToken,
      user: presentUser(user),
    }
  }
}
