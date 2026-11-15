import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'
import type { AuthUser } from '../common/types'
import { FavoriteTargetDto } from './dto/favorite-target.dto'
import { FavoritesService } from './favorites.service'

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.favoritesService.listMine(user)
  }

  @Get('status')
  @UseGuards(OptionalJwtAuthGuard)
  status(@Query() query: FavoriteTargetDto, @CurrentUser() user: AuthUser | null) {
    return this.favoritesService.status(user, query.targetType, query.targetId)
  }

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  toggle(@Body() dto: FavoriteTargetDto, @CurrentUser() user: AuthUser) {
    return this.favoritesService.toggle(user, dto.targetType, dto.targetId)
  }
}
