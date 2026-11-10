import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'
import type { AuthUser } from '../common/types'
import { CommunityService } from './community.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { ListPostsQueryDto } from './dto/list-posts-query.dto'
import { UpdatePostDto } from './dto/update-post.dto'

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('categories')
  categories() {
    return this.communityService.listCategories()
  }

  @Get('posts')
  listPosts(@Query() query: ListPostsQueryDto) {
    return this.communityService.listPosts(query)
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  getPost(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.communityService.getPost(id, user)
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.communityService.toggleLike(id, user)
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.communityService.createPost(dto, user)
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.communityService.updatePost(id, dto, user)
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.communityService.deletePost(id, user)
  }

  @Get('posts/:id/comments')
  listComments(@Param('id') id: string) {
    return this.communityService.listComments(id)
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.communityService.createComment(id, dto, user)
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.communityService.deleteComment(id, user)
  }
}
