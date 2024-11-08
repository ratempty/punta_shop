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

  @Get('/users/:UserId')
  @ApiOperation({ summary: '주문 전체 조회 api' })
  async getOrders() {
    return await this.ordersService.findAll();
  }

  @Get('/:orderId')
  @ApiOperation({ summary: '주문 조회 api' })
  async getOrder() {
    return await this.ordersService.findOne();
  }
}
