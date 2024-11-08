import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SaleStatus } from '../types/saleStatus.type';
import { OrderItem } from 'src/orders/entities/orderItem.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  quantity: number;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.ONSALE })
  saleStatus: SaleStatus;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItem: OrderItem[];
}
