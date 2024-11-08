import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { USER_ROLES } from '../users/types/user.type';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { UserInfo } from '../auth/userInfo.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Products')
@UseGuards(RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(USER_ROLES.ADMIN)
  @Post()
  @ApiOperation({
    summary: '상품 추가 API',
  })
  @ApiResponse({ status: 201, description: '성공', type: null })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: '상품 조회 API',
  })
  @ApiResponse({ status: 200, description: '성공', type: Product })
  async getProducts(@UserInfo() user: User) {
    return await this.productsService.getProducts(user);
  }

  @Roles(USER_ROLES.ADMIN)
  @Patch('/:id')
  @ApiOperation({
    summary: '상품 수정 API',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.updateProduct(+id, updateProductDto);
  }

  @Roles(USER_ROLES.ADMIN)
  @Delete('/:id')
  @ApiOperation({
    summary: '상품 삭제 API',
  })
  async deleteProduct(@Param('id') id: string) {
    return await this.productsService.deleteProduct(+id);
  }
}
