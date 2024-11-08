import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { OrderItem } from './entities/orderItem.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductsService } from 'src/products/products.service';
import { OrderStatus } from './types/orderStatus.type';
import { USER_ROLES } from 'src/users/types/user.type';
import { UsersService } from 'src/users/users.service';
import { SaleStatus } from 'src/products/types/saleStatus.type';

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
    return this.executeTransaction(async (queryRunner) => {
      const { productIds, quantities } = createOrderDto;

      if (productIds.length !== quantities.length) {
        throw new BadRequestException('상품 갯수와 수량을 확인해주세요.');
      }

      // 일반회원 주문 수량 검증 로직
      this.chkUserGrade(user, quantities);

      // 상품 정보 확인
      const productsInfos = await this.chkProducts(productIds);

      // 품절 상태 확인
      for (const product of productsInfos) {
        if (product.saleStatus === SaleStatus.SOLDOUT) {
          throw new BadRequestException('상품이 품절 상태입니다.');
        }
      }

      // 주문 총 가격 계산 로직
      let totalPrice = await this.calculate(productsInfos, quantities);
      if (user.grade === USER_ROLES.VIP) {
        totalPrice *= 0.9;
      }

      // order 인스턴스 생성 및 저장
      const order = new Order();
      order.status = OrderStatus.PAYMENT_COMPLETE;
      order.userId = user.id;
      order.discount = user.grade === USER_ROLES.VIP ? 0.9 : 1;
      order.price = totalPrice;

      const savedOrder = await queryRunner.manager.save(Order, order);

      // orderItem 인스턴스 생성 및 저장
      const orderItems = productsInfos.map((productInfo, index) => {
        const orderItem = new OrderItem();
        orderItem.productId = productInfo.id;
        orderItem.quantity = quantities[index];
        orderItem.order = savedOrder;
        return orderItem;
      });

      await queryRunner.manager.save(OrderItem, orderItems);

      // 재고 수량 확인 및 품절 처리
      await this.chkQuantity(productsInfos, quantities, queryRunner);

      return savedOrder;
    });
  }

  async findAll(user: User) {
    if (user.grade === USER_ROLES.ADMIN) {
      return await this.orderRepository.find({
        relations: ['orderItems'],
      });
    } else {
      return await this.orderRepository.find({
        where: { userId: user.id },
        relations: ['orderItems'],
      });
    }
  }

  async findOne(id: number, user: User) {
    if (user.grade === USER_ROLES.ADMIN) {
      return await this.orderRepository.find({
        where: { id },
        relations: ['orderItems'],
      });
    } else {
      const order = await this.orderRepository.find({
        where: { id },
        relations: ['orderItems'],
      });
      if (order[0].userId !== user.id) {
        throw new UnauthorizedException('확인 할 권한이 없습니다.');
      }
      return order;
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, user: User) {
    const { productIds, quantities, status } = updateOrderDto;

    if (productIds && quantities && productIds.length !== quantities.length) {
      throw new BadRequestException('상품갯수와 수량을 확인해주세요.');
    }

    return await this.executeTransaction(async (queryRunner) => {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: ['orderItems'],
      });

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.');
      }

      if (!(user.grade === USER_ROLES.ADMIN || user.id === order.userId)) {
        throw new UnauthorizedException('확인할 권한이 없습니다.');
      }

      // 상품 정보 확인 및 총 가격 계산 로직
      if (productIds && quantities) {
        const productsInfos = await this.chkProducts(productIds);
        let totalPrice = await this.calculate(productsInfos, quantities);
        totalPrice *= order.discount;
        order.price = totalPrice;
      }

      // 상태 업데이트
      if (status) {
        order.status = status;
      }

      // 주문 업데이트 및 저장
      await queryRunner.manager.save(order);
      return order;
    });
  }

  async delete(id: number, user: User) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems'],
    });

    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');

    if (user.grade === USER_ROLES.ADMIN || user.id === order.userId) {
      await this.orderRepository.delete({ id });
      await this.orderItemRepository.delete({ orderId: id });
    } else {
      throw new UnauthorizedException('삭제 권한이 없습니다.');
    }

    return { message: '주문 삭제 완료' };
  }

  async executeTransaction(
    callback: (queryRunner: QueryRunner) => Promise<any>,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async chkProducts(productIds: number[]) {
    return await Promise.all(
      productIds.map((productId) => this.productsService.findOne(productId)),
    );
  }

  async calculate(productsInfos: Product[], quantities: number[]) {
    let totalPrice = 0;

    for (let i = 0; i < productsInfos.length; i++) {
      totalPrice += productsInfos[i].price * quantities[i];
    }

    return totalPrice;
  }

  chkUserGrade(user: User, quantities: number[]) {
    if (user.grade !== USER_ROLES.VIP) {
      for (const quantity of quantities) {
        if (quantity > 5) {
          throw new BadRequestException(
            'VIP가 아닌 사용자는 한 상품당 최대 5개까지 주문할 수 있습니다.',
          );
        }
      }
    }
  }

  async chkQuantity(
    productsInfos: Product[],
    quantities: number[],
    queryRunner: any,
  ) {
    for (let i = 0; i < productsInfos.length; i++) {
      const count = productsInfos[i].quantity - quantities[i];
      if (count < 0) {
        throw new BadRequestException('재고 수량을 확인해주세요');
      } else if (count === 0) {
        await this.productsService.changeQuantity(
          productsInfos[i].id,
          count,
          queryRunner,
        );
        await this.productsService.changeSaleStatus(
          productsInfos[i].id,
          queryRunner,
        );
      } else {
        await this.productsService.changeQuantity(
          productsInfos[i].id,
          count,
          queryRunner,
        );
      }
    }
  }
}
