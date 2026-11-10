import { Module } from '@nestjs/common'
import { AdminModelsController } from './admin-models.controller'
import { ModelsController } from './models.controller'
import { ModelsService } from './models.service'

@Module({
  controllers: [ModelsController, AdminModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
