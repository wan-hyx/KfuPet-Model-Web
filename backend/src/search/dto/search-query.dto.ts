import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator'

export class SearchQueryDto {
  @IsString()
  @Length(1, 60)
  q!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 6
}
