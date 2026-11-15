import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { AdminCommunityController } from './admin-community.controller'
import { CommunityController } from './community.controller'
import { CommunityService } from './community.service'

@Module({
  imports: [NotificationsModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
