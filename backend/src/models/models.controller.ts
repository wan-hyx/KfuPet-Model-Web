import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import type { AuthUser } from '../common/types'
import { CreateModelDto } from './dto/create-model.dto'
import { ListModelsQueryDto } from './dto/list-models-query.dto'
import { UploadVersionDto } from './dto/upload-version.dto'
import { ModelsService, type ModelUploadFiles } from './models.service'

const uploadInterceptors = FileFieldsInterceptor(
  [
    { name: 'package', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ],
  {
    limits: {
      files: 2,
      fileSize: 512 * 1024 * 1024,
    },
  },
)

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get('categories')
  categories() {
    return this.modelsService.listCategories()
  }

  @Get('updates')
  updates(@Query('limit') limit?: string) {
    const parsed = Number(limit)
    const take = Number.isFinite(parsed) ? parsed : 4
    return this.modelsService.listUpdates(take)
  }

  @Get()
  list(@Query() query: ListModelsQueryDto) {
    return this.modelsService.listModels(query)
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.modelsService.listMyModels(user)
  }

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.modelsService.listVersions(id)
  }

  @Get(':id/versions/:versionId/download')
  download(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Query('source') source: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Res() res: Response,
  ) {
    return this.modelsService.download(id, versionId, source, userAgent, res)
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.modelsService.getModel(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadInterceptors)
  create(
    @Body() dto: CreateModelDto,
    @UploadedFiles() files: ModelUploadFiles,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modelsService.createModel(dto, files, user)
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadInterceptors)
  createVersion(
    @Param('id') id: string,
    @Body() dto: UploadVersionDto,
    @UploadedFiles() files: ModelUploadFiles,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modelsService.createVersion(id, dto, files, user)
  }
}
