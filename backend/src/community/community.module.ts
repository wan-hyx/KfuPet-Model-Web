import { Module } from '@nestjs/common'
import { AdminCommunityController } from './admin-community.controller'
import { CommunityController } from './community.controller'
import { CommunityService } from './community.service'

@Module({
  controllers: [CommunityController, AdminCommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
