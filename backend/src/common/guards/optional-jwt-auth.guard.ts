import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * 允许匿名访问，但在携带有效 token 时解析出当前用户。
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser | null {
    return user || null
  }
}
