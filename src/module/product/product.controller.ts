import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { checkRoleGuard } from '../../common/auth/chekrole.guard.js';
import { Roles } from '../../common/decorators/roles.decorators.js';
import { roleEnum } from '../../common/enums/user.enums.js';
import { multerOption } from '../../common/utils/multer.utils.js';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard, checkRoleGuard)
  @Roles(roleEnum.Admin)
  @Post()
  @HttpCode(201)
  @UseInterceptors(FilesInterceptor('images', 5, multerOption({})))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(AuthGuard, checkRoleGuard)
  @Roles(roleEnum.Admin)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5, multerOption({})))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.update(id, updateProductDto, files);
  }

  @UseGuards(AuthGuard, checkRoleGuard)
  @Roles(roleEnum.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
