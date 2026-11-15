import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  displayName?: string

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string

  @IsOptional()
  @IsString()
  @Matches(/^(100|[1-9]?\d)% (100|[1-9]?\d)%$/, { message: '背景位置格式不正确' })
  coverPosition?: string
}
