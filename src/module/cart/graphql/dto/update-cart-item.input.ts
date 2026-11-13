import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  quantity: number;
}
