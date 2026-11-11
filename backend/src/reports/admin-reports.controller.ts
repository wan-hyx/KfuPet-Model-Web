import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ListAdminReportsQueryDto } from './dto/list-admin-reports-query.dto'
import { ResolveReportDto } from './dto/resolve-report.dto'
import { UpdateReportStatusDto } from './dto/update-report-status.dto'
import { ReportsService } from './reports.service'

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(@Query() query: ListAdminReportsQueryDto) {
    return this.reportsService.listAdmin(query)
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.reportsService.updateStatus(id, dto)
  }

  @Post(':id/verdict')
  verdict(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.reportsService.applyVerdict(id, dto)
  }
}
