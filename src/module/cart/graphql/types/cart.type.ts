import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CartItem')
export class CartItemType {
  @Field(() => ID)
  productId: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  subtotal: number;

  @Field(() => [String], { defaultValue: [] })
  images: string[];

  @Field(() => Int)
  availableStock: number;

  @Field(() => Boolean)
  inStock: boolean;
}

@ObjectType('Cart')
export class CartType {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [CartItemType])
  items: CartItemType[];

  @Field(() => Float)
  totalPrice: number;

  @Field(() => Int)
  totalItems: number;
}
