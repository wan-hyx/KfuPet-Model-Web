import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import type { AuthUser } from '../common/types'
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto'
import { UpdateAdminUserDto } from './dto/update-admin-user.dto'
import { UsersService } from './users.service'

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListAdminUsersQueryDto) {
    return this.usersService.listAdminUsers(query)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateAdminUser(id, dto, user)
  }
}
