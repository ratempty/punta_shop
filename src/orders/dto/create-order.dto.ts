import { isArray, IsArray } from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  productIds: number[];

  @IsArray()
  quantities: number[];
}
