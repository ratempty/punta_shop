import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../types/orderStatus.type';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from 'src/orders/entities/orderItem.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  price: number;

  @Column()
  discount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PAYMENT_COMPLETE,
  })
  status: OrderStatus;

  @ManyToOne(() => User, (user) => user.order, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItem: OrderItem[];
}
