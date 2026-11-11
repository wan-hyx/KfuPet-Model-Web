import { IsBoolean } from 'class-validator'

export class ResolveReportDto {
  @IsBoolean()
  violation!: boolean
}
