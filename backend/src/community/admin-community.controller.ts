import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { CommunityService } from './community.service'
import { ListAdminPostsQueryDto } from './dto/list-admin-posts-query.dto'
import { UpdatePostFlagsDto } from './dto/update-post-flags.dto'

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  list(@Query() query: ListAdminPostsQueryDto) {
    return this.communityService.listAdminPosts(query)
  }

  @Patch(':id')
  updateFlags(@Param('id') id: string, @Body() dto: UpdatePostFlagsDto) {
    return this.communityService.updatePostFlags(id, dto)
  }
}
