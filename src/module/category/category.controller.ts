import { FileInterceptor } from '@nestjs/platform-express';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { checkRoleGuard } from '../../common/auth/chekrole.guard.js';
import { Roles } from '../../common/decorators/roles.decorators.js';
import { multerOption } from '../../common/utils/multer.utils.js';
import { roleEnum } from '../../common/enums/user.enums.js';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AuthGuard,checkRoleGuard)
  @Roles(roleEnum.User)
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('image',multerOption({})))
  @Post('add-category')
  create(@Body() createCategoryDto: CreateCategoryDto,
  @UploadedFile() file:Express.Multer.File

) {
    return this.categoryService.create(createCategoryDto,file);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get('get-categotyById:id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }
  @UseGuards(AuthGuard,checkRoleGuard)
  @Roles(1)
  @UseInterceptors(FileInterceptor('image',multerOption({})))
  @Patch('update-categotyById:id')
  update(
   @Param(':id') id: string,
   @Body() updateCategoryDto: UpdateCategoryDto,
  @UploadedFile() file?:Express.Multer.File) {
    return this.categoryService.update(id, updateCategoryDto,file);
  }

  @UseGuards(AuthGuard,checkRoleGuard)
  @Roles(1)
  @Delete('delete-categotyById:id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
