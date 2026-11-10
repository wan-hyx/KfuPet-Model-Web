import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ListAdminModelsQueryDto } from './dto/list-admin-models-query.dto'
import { UpdateModelStatusDto } from './dto/update-model-status.dto'
import { ModelsService } from './models.service'

@Controller('admin/models')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  list(@Query() query: ListAdminModelsQueryDto) {
    return this.modelsService.listAdminModels(query.status)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateModelStatusDto) {
    return this.modelsService.updateStatus(id, dto.status)
  }
}
