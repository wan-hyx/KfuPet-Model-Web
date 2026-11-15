import { Controller, Get, Param } from '@nestjs/common'
import { NoticesService } from './notices.service'

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  list() {
    return this.noticesService.list()
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.noticesService.get(id)
  }
}
