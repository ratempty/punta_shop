import { PickType } from '@nestjs/mapped-types';
import { User } from '../entities/user.entity';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto extends PickType(User, [
  'email',
  'password',
] as const) {
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요' })
  email: string;

  @IsString({ message: '유효한 비밀번호를 입력해주세요' })
  password: string;
}
