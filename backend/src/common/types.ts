import { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  role: Role
}

export interface JwtPayload {
  sub: string
  username: string
  role: Role
}
