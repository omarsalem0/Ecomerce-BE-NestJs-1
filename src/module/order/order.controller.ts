import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';

@Controller('order')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(201)
  createCashOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user._id || req.user.id || req.user.userId;
    return this.orderService.createCashOrder(userId, dto);
  }

  @Post('cash')
  @HttpCode(201)
  createCashOrderAlias(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user._id || req.user.id || req.user.userId;
    return this.orderService.createCashOrder(userId, dto);
  }

  @Post('stripe')
  @HttpCode(201)
  createStripeOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user._id || req.user.id || req.user.userId;
    return this.orderService.createStripeOrder(userId, dto);
  }
}
