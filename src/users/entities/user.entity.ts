import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { USER_ROLES } from '../types/user.type';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'kim', description: 'User name' })
  @Column()
  name: string;

  @ApiProperty({ example: 'test@gmail.com', description: 'User email' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '123456', description: 'User password' })
  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: USER_ROLES,
    default: USER_ROLES.USER,
    nullable: true,
  })
  grade: USER_ROLES;

  @Column({
    type: 'boolean',
    default: false,
  })
  isDeleted: boolean;
}
