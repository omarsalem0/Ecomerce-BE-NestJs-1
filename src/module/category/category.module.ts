import { CategoryModel } from './../../db/model/catedory.model.js';
import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { UserModel } from '../../db/model/user.model.js';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports:[CategoryModel,CategoryModel,tokenModule,UserModel]
})
export class CategoryModule {}
