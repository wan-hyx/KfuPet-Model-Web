import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

const VERSION_PATTERN = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/

export class UploadVersionDto {
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
