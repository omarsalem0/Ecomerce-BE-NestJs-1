import { Module } from '@nestjs/common';
import { OrderModel } from '../../db/model/order.model.js';
import { CartModel } from '../../db/model/cart.model.js';
import { ProductModel } from '../../db/model/product.model.js';
import { UserModel } from '../../db/model/user.model.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { OrderService } from './order.service.js';
import { OrderController } from './order.controller.js';
import { paymentServivce } from '../../common/service/stripe/stripe.service.js';

@Module({
  imports: [
    OrderModel,
    CartModel,
    ProductModel,
    UserModel,
    tokenModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, paymentServivce],
  exports: [OrderService],
})
export class OrderModule {}
