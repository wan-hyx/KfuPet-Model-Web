import { ModelStatus } from '@prisma/client'
import { IsEnum, IsOptional } from 'class-validator'

export class ListAdminModelsQueryDto {
  @IsOptional()
  @IsEnum(ModelStatus)
  status?: ModelStatus
}
