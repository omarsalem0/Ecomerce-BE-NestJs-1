import { Module } from '@nestjs/common';
import { BrandService } from './brand.service.js';
import { BrandController } from './brand.controller.js';
import { brandModel } from '../../db/model/brand.model.js';
import { ProductModel } from '../../db/model/product.model.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { UserModel } from '../../db/model/user.model.js';

@Module({
  imports: [brandModel, ProductModel, tokenModule, UserModel],
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService, brandModel],
})
export class BrandModule {}
