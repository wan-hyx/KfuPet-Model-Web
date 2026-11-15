import { IsEnum, IsString, Length } from 'class-validator'
import { FavoriteType } from '@prisma/client'

export class FavoriteTargetDto {
  @IsEnum(FavoriteType)
  targetType!: FavoriteType

  @IsString()
  @Length(1, 64)
  targetId!: string
}
