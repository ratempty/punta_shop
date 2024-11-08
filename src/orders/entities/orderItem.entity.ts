import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Product, (product) => product.orderItem)
  product: Product;

  @Column()
  productId: number;

  @ManyToOne(() => Order, (order) => order.orderItem)
  order: Order;

  @Column()
  orderId: number;
}
