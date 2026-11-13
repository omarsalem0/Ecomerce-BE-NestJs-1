import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}
