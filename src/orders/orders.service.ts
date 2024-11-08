import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { OrderItem } from './entities/orderItem.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductsService } from 'src/products/products.service';
import { OrderStatus } from './types/orderStatus.type';
import { USER_ROLES } from 'src/users/types/user.type';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,

    private readonly productsService: ProductsService,

    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { productIds, quantities } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 일반회원 주문 수량 검증 로직
      if (user.grade !== USER_ROLES.VIP) {
        for (const quantity of quantities) {
          if (quantity > 5) {
            throw new Error(
              'VIP가 아닌 사용자는 한 상품당 최대 5개까지 주문할 수 있습니다.',
            );
          }
        }
      }

      // 상품 정보 확인
      const productsInfos = await Promise.all(
        productIds.map((productId) => this.productsService.findOne(productId)),
      );

      // 주문 총 가격 계산 로직
      let totalPrice = 0;

      for (let i = 0; i < productsInfos.length; i++) {
        totalPrice += productsInfos[i].price * quantities[i];
      }

      if (user.grade === USER_ROLES.VIP) {
        totalPrice *= 0.9;
      }

      const order = new Order();
      order.status = OrderStatus.PAYMENT_COMPLETE;
      order.userId = user.id;
      order.discount = user.grade === USER_ROLES.VIP ? 0.9 : 1;
      order.price = totalPrice;

      const savedOrder = await queryRunner.manager.save(Order, order);

      const orderItems = productsInfos.map((productInfo, index) => {
        const orderItem = new OrderItem();
        orderItem.productId = productInfo.id;
        orderItem.quantity = quantities[index];
        orderItem.order = savedOrder;
        return orderItem;
      });

      await queryRunner.manager.save(OrderItem, orderItems);

      await queryRunner.commitTransaction();

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  findAll() {
    return `This action returns all orders`;
  }

  findOne() {
    return;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
