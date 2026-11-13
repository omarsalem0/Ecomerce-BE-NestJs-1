import { Module } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { ProductController } from './product.controller.js';
import { ProductModel } from '../../db/model/product.model.js';
import { CategoryModel } from '../../db/model/category.model.js';
import { brandModel } from '../../db/model/brand.model.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { UserModel } from '../../db/model/user.model.js';

@Module({
  imports: [
    ProductModel,
    CategoryModel,
    brandModel,
    tokenModule,
    UserModel,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, ProductModel],
})
export class ProductModule {}
