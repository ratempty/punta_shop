import { PickType } from '@nestjs/mapped-types';
import { User } from '../entities/user.entity';
import { IsEmail, isString, IsString } from 'class-validator';

export class CreateUserDto extends PickType(User, [
  'name',
  'email',
  'password',
] as const) {
  @IsString({ message: '유효한 이름을 입력해주세요' })
  name: string;

  @IsEmail({}, { message: '유효한 이메일을 입력해주세요' })
  email: string;

  @IsString({ message: '유효한 비밀번호를 입력해주세요' })
  password: string;
}
