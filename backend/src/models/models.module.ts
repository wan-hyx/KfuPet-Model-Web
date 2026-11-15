import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { AdminModelsController } from './admin-models.controller'
import { ModelsController } from './models.controller'
import { ModelsService } from './models.service'

@Module({
  imports: [NotificationsModule],
  controllers: [ModelsController, AdminModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
