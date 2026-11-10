import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator'

export class CreatePostDto {
  @IsString()
  @Length(3, 120)
  title!: string

  @IsString()
  @Length(1, 20000)
  content!: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  excerpt?: string

  @IsOptional()
  @IsString()
  categorySlug?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Length(1, 24, { each: true })
  tags?: string[]
}
