import { Role } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ListAdminUsersQueryDto {
  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsIn(['active', 'banned'])
  status?: 'active' | 'banned'

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
