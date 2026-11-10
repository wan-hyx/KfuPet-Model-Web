import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

const VERSION_PATTERN = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/

export class CreateModelDto {
  @IsString()
  @Length(2, 80)
  name!: string

  @IsString()
  @Length(2, 200)
  summary!: string

  @IsString()
  @Length(1, 20000)
  description!: string

  @IsString()
  categorySlug!: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tags?: string

  @IsString()
  @Matches(VERSION_PATTERN, { message: '版本号需符合 1.0.0 或 v1.0.0 格式' })
  version!: string

  @IsString()
  @Length(1, 5000)
  changelog!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  minClientVersion?: string
}
