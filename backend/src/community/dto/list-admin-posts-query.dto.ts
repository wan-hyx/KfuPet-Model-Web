import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export type AdminPostFilter = 'all' | 'hidden' | 'pinned' | 'featured'

export class ListAdminPostsQueryDto {
  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsIn(['all', 'hidden', 'pinned', 'featured'])
  filter: AdminPostFilter = 'all'

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
