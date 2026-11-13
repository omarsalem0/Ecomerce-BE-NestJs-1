import { Category } from './../../db/model/category.model.js';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { env } from '../../config/env.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../db/model/product.model.js';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) readonly _categoryModel: Model<Category>,
    @InjectModel(Product.name) readonly _productModel: Model<ProductDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, file: Express.Multer.File) {
    let { name } = createCategoryDto;
    if (!name) throw new BadRequestException('name of category is required');
    let imagUrl;
    if (file) {
      imagUrl = `${env.serverUrl}/category/${name.trim().replace(/\s+/g, '')}/${file.path}`;
    } else {
      throw new BadRequestException('file must be uploud');
    }
    let addedCategory = await this._categoryModel.insertOne({ name, image: imagUrl });
    if (!addedCategory) throw new BadRequestException('somthing went wrong for added category');
    return addedCategory;
  }

  async findAll() {
    let allCategory = await this._categoryModel.find();
    if (allCategory.length == 0) {
      return { message: 'no category found' };
    }
    return allCategory;
  }

  async findOne(id: string) {
    let exsistCategory = await this._categoryModel.findById(id);
    if (!exsistCategory) throw new BadRequestException('category for id is not found');
    return exsistCategory;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, file?: Express.Multer.File) {
    let { name } = updateCategoryDto;
    let imagUrl;
    if (file) {
      imagUrl = `${env.serverUrl}/category/${name}/${file.path}`;
    } else {
      throw new BadRequestException('file must be uploud');
    }
    let exsistCategory = await this._categoryModel.findById(id);
    if (!exsistCategory) throw new BadRequestException('category for id is not found');

    let updatedCategory = await this._categoryModel.findByIdAndUpdate(
      id,
      { name, image: imagUrl },
      { new: true },
    );
    if (!updatedCategory) throw new BadRequestException('something went wrong for updated category');
    return updatedCategory;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const productsCount = await this._productModel.countDocuments({
      categoryId: new Types.ObjectId(id),
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: ${productsCount} product(s) still reference it`,
      );
    }

    const deletedCategory = await this._categoryModel.findByIdAndDelete(id);
    if (!deletedCategory) {
      throw new NotFoundException('Category not found');
    }
    return { message: 'deleted successfully', deletedCategory };
  }
}
