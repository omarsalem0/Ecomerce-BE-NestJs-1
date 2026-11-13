import { Module } from '@nestjs/common';
import { CartModel } from '../../db/model/cart.model.js';
import { ProductModel } from '../../db/model/product.model.js';
import { CartService } from './cart.service.js';
import { CartResolver } from './cart.resolver.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { GqlAuthGuard } from '../../common/auth/gql-auth.guard.js';

@Module({
  imports: [CartModel, ProductModel, tokenModule],
  providers: [CartService, CartResolver, GqlAuthGuard],
  exports: [CartService],
})
export class CartModule {}
