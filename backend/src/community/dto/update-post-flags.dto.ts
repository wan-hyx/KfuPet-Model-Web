import { IsBoolean, IsOptional } from 'class-validator'

export class UpdatePostFlagsDto {
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean
}
