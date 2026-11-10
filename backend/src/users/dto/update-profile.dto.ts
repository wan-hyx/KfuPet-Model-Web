import { IsOptional, IsString, Length, MaxLength } from 'class-validator'

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
}
