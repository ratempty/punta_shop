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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/auth/userInfo.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('Orders')
@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '주문 생성 api' })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @UserInfo() user: User,
  ) {
    return await this.ordersService.create(createOrderDto, user);
  }

  @Get()
  @ApiOperation({ summary: '주문 전체 조회 api' })
  async getOrders(@UserInfo() user: User) {
    return await this.ordersService.findAll(user);
  }

  @Get('/:id')
  @ApiOperation({ summary: '주문 조회 api' })
  async getOrder(@Param() id: string, @UserInfo() user: User) {
    return await this.ordersService.findOne(+id, user);
  }

  @Patch('/:id')
  @ApiOperation({ summary: '주문 수정 api' })
  async updateOrder(
    @Param() id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @UserInfo() user: User,
  ) {
    return await this.ordersService.update(+id, updateOrderDto, user);
  }

  @Delete('/:id')
  @ApiOperation({ summary: '주문 삭제 api' })
  async deleteOrder(@Param() id: string, @UserInfo() user: User) {
    return await this.ordersService.delete(+id, user);
  }
}
