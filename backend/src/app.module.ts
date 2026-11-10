import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { CommunityModule } from './community/community.module'
import { HealthController } from './health/health.controller'
import { HomeModule } from './home/home.module'
import { ModelsModule } from './models/models.module'
import { PrismaModule } from './prisma/prisma.module'
import { StorageModule } from './storage/storage.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CommunityModule,
    ModelsModule,
    HomeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
