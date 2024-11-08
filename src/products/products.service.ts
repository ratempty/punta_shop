import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { USER_ROLES } from 'src/users/types/user.type';
import { SaleStatus } from './types/saleStatus.type';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return await this.productRepository.save({ ...createProductDto });
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!product) throw new NotFoundException('해당 상품이 없습니다.');

    return product;
  }

  async getProducts(user: User) {
    if (user.grade == USER_ROLES.ADMIN) {
      return await this.productRepository.findBy({});
    } else {
      return await this.productRepository.findBy({
        saleStatus: SaleStatus.ONSALE,
        isDeleted: false,
      });
    }
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    // 재고 수량을 0으로 변경하는경우 품절처리
    if (updateProductDto.quantity <= 0) {
      await this.productRepository.update(
        { id },
        { ...updateProductDto, saleStatus: SaleStatus.SOLDOUT },
      );
    } else if (product.quantity == 0 && updateProductDto.quantity > 0) {
      // 재고 수량이 0일때 수량을 추가하는 경우 판매중 처리
      await this.productRepository.update(
        { id },
        { ...updateProductDto, saleStatus: SaleStatus.ONSALE },
      );
    } else {
      await this.productRepository.update({ id }, { ...updateProductDto });
    }

    return await this.findOne(id);
  }

  async deleteProduct(id: number) {
    await this.findOne(id);

    await this.productRepository.update({ id }, { isDeleted: true });
    return { message: '상품 삭제 완료' };
  }

  // 재고 수량에 따른 품절처리 함수
  async changeSaleStatus(id: number, queryRunner: any) {
    await queryRunner.manager.update(
      Product,
      { id },
      { saleStatus: SaleStatus.SOLDOUT },
    );
  }

  // 재고 수량 변경 함수
  async changeQuantity(id: number, remainder: number, queryRunner: any) {
    await queryRunner.manager.update(Product, { id }, { quantity: remainder });
  }
}
