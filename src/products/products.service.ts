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
    const product = await this.productRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!product) throw new NotFoundException('해당 상품이 없습니다.');

    await this.productRepository.update({ id }, { ...updateProductDto });

    return await this.productRepository.findOne({ where: { id } });
  }

  async deleteProduct(id: number) {
    const product = await this.productRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!product) throw new NotFoundException('해당 상품이 없습니다.');

    await this.productRepository.update({ id }, { isDeleted: true });
    return { message: '상품 삭제 완료' };
  }
}
