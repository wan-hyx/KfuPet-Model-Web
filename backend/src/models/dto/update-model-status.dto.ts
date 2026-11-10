import { ModelStatus } from '@prisma/client'
import { IsEnum } from 'class-validator'

export class UpdateModelStatusDto {
  @IsEnum(ModelStatus)
  status!: ModelStatus
}
