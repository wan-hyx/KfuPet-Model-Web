import { ReportTargetType } from '@prisma/client'
import { IsEnum, IsString, Length } from 'class-validator'

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType

  @IsString()
  @Length(1, 64)
  targetId!: string

  @IsString()
  @Length(1, 40)
  reason!: string

  @IsString()
  @Length(10, 1000)
  detail!: string
}
