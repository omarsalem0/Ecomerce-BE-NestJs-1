import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode } from '@nestjs/common';
import { BrandService } from './brand.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { checkRoleGuard } from '../../common/auth/chekrole.guard.js';
import { Roles } from '../../common/decorators/roles.decorators.js';
import { roleEnum } from '../../common/enums/user.enums.js';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @UseGuards(AuthGuard, checkRoleGuard)
  @Roles(roleEnum.Admin)
  @Post()
  @HttpCode(201)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @UseGuards(AuthGuard, checkRoleGuard)
  @Roles(roleEnum.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(id, updateBrandDto);
  }

  @UseGuards(AuthGuard, checkRoleGuard)
  @Roles(roleEnum.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
