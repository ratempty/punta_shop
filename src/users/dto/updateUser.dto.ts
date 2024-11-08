import { PartialType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { USER_ROLES } from '../types/user.type';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(User) {
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요' })
  email?: string;

  @IsString({ message: '유효한 이름을 입력해주세요' })
  name?: string;

  @IsEnum(USER_ROLES)
  grade?: USER_ROLES;
}
