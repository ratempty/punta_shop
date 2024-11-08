import { SetMetadata } from '@nestjs/common';
import { USER_ROLES } from '../users/types/user.type';

export const Roles = (...roles: USER_ROLES[]) => SetMetadata('roles', roles);
