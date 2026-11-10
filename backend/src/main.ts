import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { resolve } from 'node:path'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  const corsOrigin = config.get<string>('CORS_ORIGIN')
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((origin) => origin.trim()) : true,
    credentials: true,
  })

  const uploadDir = resolve(process.cwd(), config.get<string>('UPLOAD_DIR') ?? 'uploads')
  app.useStaticAssets(resolve(uploadDir, 'images'), { prefix: '/media/' })

  const port = Number(config.get<string>('PORT') ?? 3000)
  await app.listen(port)
}

void bootstrap()
