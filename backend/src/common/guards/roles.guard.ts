import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { AuthUser } from '../types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles?.length) return true

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('没有访问该资源的权限')
    }

    return true
  }
}
