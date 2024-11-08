import { Injectable, NotFoundException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Request as RequestType } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }

  private static extractJWT(req: RequestType): string | null {
    if (req.headers.cookie && req.headers.cookie.length > 0) {
      const [key, value] = req.headers.cookie.split('=');
      return value;
    }
    return null;
  }

  async validate(payload: any) {
    const user = await this.userService.findOneByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('해당하는 사용자를 찾을 수 없습니다.');
    }

    return user;
  }
}
