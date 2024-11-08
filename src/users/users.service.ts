import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/loginUser.dto';
import { USER_ROLES } from './types/user.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email, isDeleted: false },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;

    const existUser = await this.findOneByEmail(email);

    if (existUser)
      throw new ConflictException('해당 이메일은 이미 존재합니다.');

    const hashPassword = await bcrypt.hash(password, 10);

    await this.usersRepository.save({
      email,
      password: hashPassword,
      name,
    });
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.findOneByEmail(email);

    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const chkPassword = await bcrypt.compare(password, user.password);
    if (!chkPassword)
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

    const accessTokenPayload = { email, sub: user.id, token_type: 'access' };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '15m',
    });

    return accessToken;
  }

  async getUserInfo({ id, user }: { id: number; user: User }) {
    if (user.grade !== USER_ROLES.ADMIN && id !== user.id)
      throw new UnauthorizedException('정보를 확인할 권한이 없습니다.');

    const findUser = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!findUser) throw new NotFoundException('해당 유저가 없습니다.');

    delete findUser.password;

    return findUser;
  }

  async updateUserInfo({
    id,
    updateUserDto,
    user,
  }: {
    id: number;
    updateUserDto: UpdateUserDto;
    user: User;
  }) {
    if (user.grade !== USER_ROLES.ADMIN && id !== user.id)
      throw new UnauthorizedException('정보를 확인할 권한이 없습니다.');

    const findUser = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!findUser) throw new NotFoundException('해당 유저가 없습니다.');

    const emailChanged =
      updateUserDto.email && updateUserDto.email !== findUser.email;

    await this.usersRepository.update({ id }, { ...updateUserDto });

    // 이메일이 변경된 경우 새로운 JWT 토큰 발급
    let newAccessToken = null;
    if (emailChanged) {
      newAccessToken = this.jwtService.sign(
        { email: updateUserDto.email, sub: user.id, token_type: 'access' },
        { expiresIn: '15m' },
      );
    }

    // 업데이트된 유저 정보와 새 토큰 반환
    const updatedUserInfo = await this.getUserInfo({ id, user });
    return { ...updatedUserInfo, newAccessToken };
  }

  async deleteUser({ id, user }: { id: number; user: User }) {
    if (user.grade !== USER_ROLES.ADMIN && id !== user.id)
      throw new UnauthorizedException('정보를 확인할 권한이 없습니다.');

    const findUser = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!findUser) throw new NotFoundException('해당 유저가 없습니다.');

    await this.usersRepository.update({ id }, { isDeleted: true });

    return { message: '유저 삭제 완료' };
  }
}
