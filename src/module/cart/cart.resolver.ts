import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CartType } from './graphql/types/cart.type.js';
import { AddToCartInput } from './graphql/dto/add-to-cart.input.js';
import { UpdateCartItemInput } from './graphql/dto/update-cart-item.input.js';
import { GqlAuthGuard } from '../../common/auth/gql-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Resolver(() => CartType)
@UseGuards(GqlAuthGuard)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartType, { name: 'getMyCart' })
  async getMyCart(@CurrentUser() user: any): Promise<CartType> {
    const userId = user._id || user.id || user.userId;
    return this.cartService.getCart(userId);
  }

  @Mutation(() => CartType, { name: 'addToCart' })
  async addToCart(
    @CurrentUser() user: any,
    @Args('productId', { type: () => String, nullable: true }) productId?: string,
    @Args('quantity', { type: () => Int, nullable: true }) quantity?: number,
    @Args('input', { type: () => AddToCartInput, nullable: true }) input?: AddToCartInput,
  ): Promise<CartType> {
    const userId = user._id || user.id || user.userId;
    const finalProductId = input?.productId || productId;
    const finalQuantity = input?.quantity ?? quantity ?? 1;

    return this.cartService.addToCart(userId, {
      productId: finalProductId as string,
      quantity: finalQuantity,
    });
  }

  @Mutation(() => CartType, { name: 'updateCartItem' })
  async updateCartItem(
    @CurrentUser() user: any,
    @Args('productId', { type: () => String, nullable: true }) productId?: string,
    @Args('quantity', { type: () => Int, nullable: true }) quantity?: number,
    @Args('input', { type: () => UpdateCartItemInput, nullable: true }) input?: UpdateCartItemInput,
  ): Promise<CartType> {
    const userId = user._id || user.id || user.userId;
    const finalProductId = input?.productId || productId;
    const finalQuantity = input?.quantity ?? quantity ?? 1;

    return this.cartService.updateItemQuantity(userId, finalProductId as string, finalQuantity);
  }

  @Mutation(() => CartType, { name: 'removeFromCart' })
  async removeFromCart(
    @CurrentUser() user: any,
    @Args('productId') productId: string,
  ): Promise<CartType> {
    const userId = user._id || user.id || user.userId;
    return this.cartService.removeItem(userId, productId);
  }

  @Mutation(() => CartType, { name: 'clearCart' })
  async clearCart(@CurrentUser() user: any): Promise<CartType> {
    const userId = user._id || user.id || user.userId;
    return this.cartService.clearCart(userId);
  }
}
