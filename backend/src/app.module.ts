import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { CommunityModule } from './community/community.module'
import { FavoritesModule } from './favorites/favorites.module'
import { HealthController } from './health/health.controller'
import { HomeModule } from './home/home.module'
import { ModelsModule } from './models/models.module'
import { NoticesModule } from './notices/notices.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PrismaModule } from './prisma/prisma.module'
import { ReportsModule } from './reports/reports.module'
import { SearchModule } from './search/search.module'
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
    ReportsModule,
    HomeModule,
    NoticesModule,
    FavoritesModule,
    NotificationsModule,
    SearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
