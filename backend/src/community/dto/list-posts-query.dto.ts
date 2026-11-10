import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ListPostsQueryDto {
  @IsOptional()
  @IsIn(['latest', 'hot'])
  sort: 'latest' | 'hot' = 'latest'

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  tag?: string

  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20
}
