import { CategoryModel } from './../../db/model/category.model.js';
import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { UserModel } from '../../db/model/user.model.js';
import { ProductModel } from '../../db/model/product.model.js';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [CategoryModel, ProductModel, tokenModule, UserModel],
  exports: [CategoryService, CategoryModel],
})
export class CategoryModule {}
