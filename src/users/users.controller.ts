import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/loginUser.dto';
import { UserResponseDto } from './dto/userResponse.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { UserInfo } from '../auth/userInfo.decorator';

@ApiTags('Users')
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/signup')
  @ApiOperation({
    summary: '유저생성 API',
  })
  @ApiResponse({ status: 201, description: '성공', type: null })
  async createUser(@Body() CreateUserDto: CreateUserDto) {
    return await this.usersService.create(CreateUserDto);
  }

  @Post('/login')
  @ApiOperation({
    summary: '로그인 API',
  })
  @ApiResponse({ status: 200, type: null })
  async login(
    @Body() LoginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.usersService.login(LoginUserDto);

    res.cookie('Authorization', accessToken, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000,
    });

    return accessToken;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  @ApiOperation({
    summary: '유저정보 조회 API',
  })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  async getUserInfo(@Param('id') id: string, @UserInfo() user: User) {
    return await this.usersService.getUserInfo({ id: +id, user });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/:id')
  @ApiOperation({
    summary: '유저 정보 수정 API',
  })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  async updateUserInfo(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UserInfo() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.updateUserInfo({
      id: +id,
      updateUserDto,
      user,
    });

    // 이메일 변경으로 새로운 토큰이 발급된 경우, 쿠키로 설정
    if (result.newAccessToken) {
      res.cookie('Authorization', result.newAccessToken, {
        httpOnly: true,
        maxAge: 12 * 60 * 60 * 1000,
      });
    }

    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/:id')
  @ApiOperation({
    summary: '유저 소프트 딜리트 API',
  })
  @ApiResponse({ status: 204, description: '성공', type: null })
  async deleteUser(@Param('id') id: string, @UserInfo() user: User) {
    return await this.usersService.deleteUser({ id: +id, user });
  }
}
