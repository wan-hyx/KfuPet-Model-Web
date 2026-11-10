import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator'

export class RegisterDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,24}$/, {
    message: '用户名只能包含字母、数字、下划线或连字符，长度 3-24 位',
  })
  username!: string

  @IsString()
  @Length(8, 72, { message: '密码长度需在 8-72 位之间' })
  password!: string

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string
}
