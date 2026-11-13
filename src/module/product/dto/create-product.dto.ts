import { IsArray, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  publicId?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(2, { message: 'Product name must be at least 2 characters' })
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Price must be a valid number' })
  @IsPositive({ message: 'Price must be greater than 0' })
  @Type(() => Number)
  price: number;

  @IsInt({ message: 'Stock must be an integer' })
  @Min(0, { message: 'Stock cannot be negative' })
  @Type(() => Number)
  stock: number;

  @IsMongoId({ message: 'Invalid category ID format' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId: string;

  @IsMongoId({ message: 'Invalid brand ID format' })
  @IsNotEmpty({ message: 'Brand ID is required' })
  brandId: string;

  @IsArray()
  @IsOptional()
  images?: (string | ProductImageDto)[];
}
