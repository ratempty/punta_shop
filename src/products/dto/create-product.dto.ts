import { PickType } from '@nestjs/mapped-types';
import { Product } from '../entities/product.entity';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SaleStatus } from '../types/saleStatus.type';

export class CreateProductDto extends PickType(Product, [
  'name',
  'price',
  'quantity',
  'saleStatus',
] as const) {
  @IsString({ message: '유효한 상품명을 입력해주세요' })
  name: string;

  @IsNumber({}, { message: '유효한 가격을 입력해주세요' })
  price: number;

  @IsNumber({}, { message: '유효한 수량을 입력해주세요' })
  quantity: number;

  @IsOptional()
  @IsEnum(SaleStatus)
  saleStatus: SaleStatus;
}
