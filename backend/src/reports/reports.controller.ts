import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import type { AuthUser } from '../common/types'
import { CreateReportDto } from './dto/create-report.dto'
import { ReportsService } from './reports.service'

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.reportsService.create(dto, user)
  }
}
