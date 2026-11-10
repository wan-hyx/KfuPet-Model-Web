import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ListModelsQueryDto {
  @IsOptional()
  @IsIn(['latest', 'hot', 'updated'])
  sort: 'latest' | 'hot' | 'updated' = 'latest'

  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsString()
  category?: string

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
  pageSize = 12
}
